const router = require("express").Router();
const User = require("../models/User");

// CRUD
// ユーザ情報の更新
router.put("/update/:id", async (req, res) => {
    if(req.body.userId === req.params.id || req.body.isAdmin) {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, {
                $set: req.body,
            });
            res.status(200).json("ユーザー情報が更新されました");
        } catch (err) {
            return res.status(500).json(err);
        }
    } else {
        return res.status(403).json("あなたは自分のアカウントの時だけ情報更新できます");
    }
});

// ユーザ情報の削除
router.delete("/delete/:id", async (req, res) => {
    if(req.body.userId === req.params.id || req.body.isAdmin) {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            res.status(200).json("ユーザー情報が削除されました");
        } catch (err) {
            return res.status(500).json(err);
        }
    } else {
        return res.status(403).json("あなたは自分のアカウントの時だけ削除できます");
    }
});

// クエリでユーザー情報を取得
router.get("/", async (req, res) => {
    const userId = req.query.userId;
    const username = req.query.username;

    try {
        const user = userId 
            ? await User.findById(userId) 
            : await User.findOne({ username: username });

        const { password, updatedAt, ...other } = user._doc;
        return res.status(200).json(other);
    } catch (err) {
        return res.status(500).json(err);
    }
});

// ユーザーのフォロー
router.put("/:id/follow", async(req, res) => {
    if(req.body.userId !== req.params.id){
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            // フォロワーに自分がいなかったらフォローできる
            if(!user.followers.includes(req.body.userId)) {
                await user.updateOne({
                    $push: {
                        followers: req.body.userId,
                    },
                });
                await currentUser.updateOne({
                    $push: {
                        followings: req.params.id,
                    },
                });
                return res.status(200).json("フォローに成功しました！");
            } else {
                return res.status(403).json("あなたはすでにこのユーザーをフォローしています");
            }
        } catch(err) {
            return res.status(500).json(err);
        }
    } else {
        return res.status(500).json("自分自身をフォローできません。")
    }
});

// ユーザーのフォローを外す
router.put("/:id/unfollow", async(req, res) => {
    if(req.body.userId !== req.params.id){
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            // フォロワーに存在したらフォローを外せる
            if(user.followers.includes(req.body.userId)) {
                await user.updateOne({
                    $pull: {
                        followers: req.body.userId,
                    },
                });
                await currentUser.updateOne({
                    $pull: {
                        followings: req.params.id,
                    },
                });
                return res.status(200).json("フォローを解除しました！");
            } else {
                return res.status(403).json("このユーザーはフォローを解除できません");
            }
        } catch(err) {
            return res.status(500).json(err);
        }
    } else {
        return res.status(500).json("自分自身をフォローを解除できません")
    }
});

// フォロー中のユーザー情報を取得
router.get("/user/:id/follow", async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const followings = await Promise.all(user.followings.map(async (value) => {
            return await User.findById(value);
        }));
        res.status(200).json(followings);
    } catch(err) {
        return res.status(500).json(err);
    }
});

// フォロワーのユーザー情報を取得
router.get("/user/:id/follower", async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const followers = await Promise.all(user.followers.map(async (value) => {
            return await User.findById(value);
        }));
        res.status(200).json(followers);
    } catch(err) {
        return res.status(500).json(err);
    }
});


module.exports = router;