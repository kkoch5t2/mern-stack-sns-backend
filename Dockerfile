# ベースイメージの指定
FROM node:20

# 作業ディレクトリの設定
WORKDIR /app/backend

# バックエンドの依存関係のインストール
COPY package*.json ./
RUN npm install

# ソースコードの追加
COPY . .

# ポートの公開
EXPOSE 5000

# アプリケーションの起動
CMD ["npm", "start"]