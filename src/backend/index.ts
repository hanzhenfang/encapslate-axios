import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 8765
let counts = 0

app.use(cors())

app.get('/user', (req, res) => {
  const rsp = {
    code: 20000,
    staus: 20,
    message: 'success',
    data: {
      name: '韩振方',
      age: 22,
    },
  }
  console.log('请求的地址', req.host)
  res.setHeader('Access-Control-Allow-Origin', 'http://192.168.10.168:5173')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  res.json(rsp)
})

app.listen(PORT, () => {
  console.log(`服务器已经监听在 ${PORT}`)
})
