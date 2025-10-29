# loomio_channel_server

This repo performs 3 node.js based functions for Loomio

1. Live update via socket.io. So if a new comment is posted, you will see it appear.
2. Realtime collaboration and state saving for user generated content. So if you write a comment and refresh before posting, the comment is restored on reload. Also you can see the cursors of other people editing, just like Google docs.
3. Matrix bot. When you select a Matrix chatbot integration, it is run from here.

1 and 3 depend on a redis connection to receive the latest data as it happens from the rails app.

ENVs and example values for using with docker-compose.yml from loomio-deploy
PUBLIC_APP_URL=https://loomio.example.com
PRIVATE_APP_URL=http://app:3000
REDIS_URL=redis://redis:6379/0


However, why are you here? loomio-deploy manages this for you.
