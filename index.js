const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 42111;

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// 解析请求体
app.use(bodyParser.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip} - ${req.get('User-Agent')} - Request Body: ${JSON.stringify(req.body)}`);
    res.on('finish', () => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Response Status: ${res.statusCode} - Response Body: ${res.statusMessage}`);
    });
    next();
  });
  

// 首页路由
app.get('/', (req, res) => {
  res.render('index');
});

// 加载邀请码文件
const inviteCodesFile = 'invite_codes.json';
if (!fs.existsSync(inviteCodesFile)) {
  fs.writeFileSync(inviteCodesFile, '');
  console.log(`Created ${inviteCodesFile}`);
}

// 加载邀请码列表
let inviteCodes = fs.readFileSync(inviteCodesFile, 'utf8').split('\n');

// 处理表单提交
app.post('/activate', 
  body('username').trim().escape(),
  body('inviteCode').trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, inviteCode } = req.body;

    // 从邀请码文件中读取邀请码列表
    const inviteCodes = JSON.parse(fs.readFileSync('invite_codes.json', 'utf8'));

    // 校验邀请码
    if (inviteCodes[inviteCode] === false) {
      // 从 JSON 文件中读取数据
      const filePath = './ZBProxy.json';
      let jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // 检查是否存在相同的用户名
      if (jsonData.Lists.dcbb.includes(username)) {
        return res.send('<h1>此用户已经激活！</h1>');
      }

      // 更新 JSON 文件
      jsonData.Lists.dcbb.push(username);
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

      // 更新邀请码文件，将邀请码标记为已使用
      inviteCodes[inviteCode] = true;
      fs.writeFileSync('invite_codes.json', JSON.stringify(inviteCodes, null, 2));

      // 渲染信息页面
      res.render('info', { targetAddress: jsonData.Services[0].TargetAddress });
    } else {
      res.send('<h1>邀请码错误或已经被使用！</h1>');
    }
  }
);

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
