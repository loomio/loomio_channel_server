let port = process.env.PORT || 5000
let defaultData = {
  "version": 0,
  "doc": {
    "type": "doc",
    "content": [{"type": "paragraph"}]
  }
}

assumed_app_url = "https://"+(process.env.VIRTUAL_HOST || '').replace('channels.','')

const config = {
	"port": port,
	"defaultData": defaultData,
	'allowedOrigins': (process.env.APP_URL || assumed_app_url),
  "redis": (process.env.REDIS_URL || 'redis://localhost:6379')
}

module.exports = config
