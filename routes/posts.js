const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");



// 検索された投稿を取得
router.get("/search", async (req,res) => {
    const param = req.query.q
    try{
        const posts = await Post.find({desc: RegExp(".*" + param + ".*" , "i")});
        // 自分がフォローしている友達の投稿内容をすべて取得する
        if(param===""){
            return res.status(200).json(null);
        } else {
            const friendPosts =await Promise.all(posts);
            return res.status(200).json(friendPosts);
        }
    } catch(err) {
        return res.status(500).json(err);
    }
});

// 通知用の返信投稿を取得
router.get("/notification/reply/:id", async (req,res) => {
    try{
        const myPosts = await Post.find({userId: req.params.id});

        // 自分がフォローしている友達の投稿内容をすべて取得する
        const myPost = await Post.findById("65da30ea090d2c752ae9f7aa");

        const postsId = myPosts.map((obj) => obj._id.toString())
        // 繰り返し処理
        const replayPosts = await Promise.all(
            postsId.map((postId) => {
                return Post.find({replyPostId: postId});
            })
        );

        const filteredArray = replayPosts.filter(innerArray => innerArray.length > 0);
        
        // let stringRepresentation = JSON.stringify(filteredArray);
        const withoutBrackets = filteredArray.flat();
        const filteredPosts = withoutBrackets.filter(post => post.userId !== req.params.id);
        return res.status(200).json(filteredPosts);
    } catch(err) {
        return res.status(500).json(err);
    }
});

// 通知用のいいねを取得
router.get("/notification/like/:id", async (req,res) => {
    try{
        const myPosts = await Post.find({userId: req.params.id});
        var val = req.params.id;
        const filteredArray = myPosts.map(post => ({
            ...post.toObject(),
            likes: post.likes.filter(like => like.id !== val)
        })).filter(innerArray => innerArray.likes.length > 0);
        
        const latestKey4 = filteredArray.reduce((latestDate, item) => {
            return Math.max(latestDate, ...item.likes.map(subItem => subItem.updatedAt));
        }, new Date(0));
        
        // データのコピーを作成
        const newData = JSON.parse(JSON.stringify(filteredArray));

        // key2 内の key4 の最新日時でデータを並び替える関数
        const sortData = (data) => {
            // key2 内の key4 を抽出し、それぞれの最新日時を求める
            const latestDates = data.map(item =>
                item.likes.map(subItem => new Date(subItem.updatedAt)).reduce((latestDate, currentDate) =>
                latestDate ? (currentDate > latestDate ? currentDate : latestDate) : currentDate, null)
            );

            // 最新日時で降順に並び替える
            const sortedData = [...data].sort((a, b) => {
                const latestDateA = latestDates[data.indexOf(a)];
                const latestDateB = latestDates[data.indexOf(b)];
                return latestDateB - latestDateA;
            });

            return sortedData;
        };

        // データを並び替える
        const sortedData = sortData(newData);
        console.log(sortedData);
        return res.status(200).json(sortedData);
    } catch(err) {
        return res.status(500).json(err);
    }
});

// 投稿を作成する
router.post("/", async (req, res) => {
    const newPost = new Post(req.body);
    try{
        const savedPost = await newPost.save();
        return res.status(200).json(savedPost);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// 投稿を更新する
router.put("/:id", async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(post.userId === req.body.userId) {
            await post.updateOne({
                $set: req.body,
            });
            return res.status(200).json("投稿編集に成功しました");
        } else {
            return res.status(403).json("あなたは他の人の投稿を編集できません");
        }
    } catch(err){
        return res.status(403).json(err);
    }
});

// 投稿を削除する
router.delete("/:id", async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(post.userId === req.body.userId) {
            await post.deleteOne();
            return res.status(200).json("投稿削除に成功しました");
        } else {
            return res.status(403).json("あなたは他の人の投稿を削除できません");
        }
    } catch(err){
        return res.status(403).json(err);
    }
});

// 特定の投稿を取得する
router.get("/post/:id", async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        return res.status(200).json(post);
    } catch(err){
        return res.status(403).json(err);
    }
});

// 特定の投稿の返信を取得する
router.get("/reply/:id", async (req, res) => {
    try{
        const post = await Post.find({replyPostId: req.params.id});
        return res.status(200).json(post);
    } catch(err){
        return res.status(403).json(err);
    }
});

// 特定の投稿にいいねを押す
router.put("/:id/like", async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const user = await User.findById(req.body.userId);
        // まだ投稿にいいねが押されていなかったら
        if(!post.likes.some(item => item.id === req.body.userId)) {
            await post.updateOne({
                $push: {
                    likes: {
                        id: req.body.userId,
                        username: user.username,
                        updatedAt: new Date(),
                    }
                },
            });
            return res.status(200).json("投稿にいいねを押しました");
        // 投稿にいいねが押されていたら
        } else {
            // いいねしているユーザーIDを取り除く
            await post.updateOne({
                $pull: {
                    likes: {
                        id: req.body.userId,
                    }
                },
            });
            return res.status(403).json("いいねを外しました");
        }
    } catch(err) {
        return res.status(500).json(err);
    }
});

// プロフィール専用のタイムラインの投稿を取得
router.get("/profile/:username", async(req,res) => {
    try{
        const user = await User.findOne({username: req.params.username});
        const posts = await Post.find({userId: user._id});
        return res.status(200).json(posts);
    } catch(err) {
        return res.status(500).json(err);
    }
});

// タイムラインの投稿を取得
router.get("/timeline/:userId", async(req,res) => {
    try{
        const currentUser = await User.findById(req.params.userId);
        const userPosts = await Post.find({userId: currentUser._id});
        // 自分がフォローしている友達の投稿内容をすべて取得する
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({userId: friendId});
            })
        );
        return res.status(200).json(userPosts.concat(...friendPosts));
    } catch(err) {
        return res.status(500).json(err);
    }
});

// postIdからユーザー情報を取得
router.get("/post/:id/user", async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        try{
            const user = await User.findById(post.userId);
            res.status(200).json(user);
        } catch(err) {
            return res.status(200).json("該当する投稿が見つかりません");
        }
    } catch(err) {
        return res.status(500).json(err);
    }
});


module.exports = router;