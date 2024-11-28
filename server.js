// 引入依赖
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// 钉钉机器人的 Webhook URL（替换为你自己的钉钉 webhook URL）


const dingTalkWebhook = 'https://oapi.dingtalk.com/robot/send?access_token=22b340754350a48aff0c24bdd7c7ff1beb200c514f974b747e08f9f212670441';


// 使服务器能够解析 JSON 请求体
app.use(express.json());

// 处理 GitLab Webhook 请求
app.post('/gitlab-webhook', (req, res) => {
    // 获取流水线状态
    const pipelineStatus = req.body.object_attributes.status;
    console.log("pipelineStatus：",pipelineStatus)
    const builds = req.body.builds || [];




    if (pipelineStatus === "success") {
        // 查找 stage 为 deploy 且 status 为 success 的构建
        for (const build of builds) {
            console.log("build.status：",build.status)
            if (build.stage === "deploy" && build.status === "success") {
                const environmentName = build.environment?.name || "未定义"
                const triggerUser = build.user.name;
                const message = {
                    msgtype: 'markdown',
                    markdown: {
                        title: 'GitLab Pipeline 成功通知',
                        text: `
# <font color="#ff7f50">流水线通知</font>
---
- **项目**：${req.body.project.name}
- **分支**：${req.body.object_attributes.ref}
- **环境**：${environmentName}
- **流水线**：${req.body.commit.title}
* **状态**：<font color="green">${req.body.object_attributes.status}</font>
- **触发用户**：${triggerUser}
- ## [查看详情](${req.body.object_attributes.url})`
                    }
                };

                axios.post(dingTalkWebhook, message)
                    .then(response => {
                        console.log('消息已发送到钉钉:', response.data);
                    })
                    .catch(error => {
                        console.error('发送消息到钉钉时出错:', error);
                    });

            }
        }
    }else if (pipelineStatus === "failed") {
        // 查找第一个失败的构建
        const failedBuild = builds.find(build => build.status === "failed");

        if (failedBuild) {
            // const failedStage = failedBuild.name || "未知阶段";
            // const environmentName = failedBuild.environment?.name;
            const environmentName = failedBuild.environment?.name || "未定义"
            // 触发用户，当前job的触发用户
            const triggerUser = failedBuild.user.name;
            const message = {
                msgtype: 'markdown',
                at: {
                    "isAtAll": true
                },
                markdown: {
                    title: 'GitLab Pipeline 失败通知',
                    text: `
# <font color="#ff7f50">流水线通知</font>
---
- **项目：** ${req.body.project.name}
- **分支：** ${req.body.object_attributes.ref}
- **环境**：${environmentName}
- **流水线：** ${req.body.commit.title}
* **状态：** <font color="red">${req.body.object_attributes.status}</font>
- **触发用户：** ${triggerUser}
- ## [查看详情](${req.body.object_attributes.url})`
                }
            };

            // 向钉钉发送消息
            axios.post(dingTalkWebhook, message)
                .then(response => {
                    console.log('消息已发送到钉钉:', response.data);
                })
                .catch(error => {
                    console.error('发送消息到钉钉时出错:', error);
                });

        }
    }


    // if (pipelineStatus === 'failed' ) {
        //构造要发送给钉钉的消息
//         message = {
//             msgtype: 'markdown',
//             at: {
//                 "isAtAll": true
//             },
//             markdown: {
//                 title: 'GitLab Pipeline 事件通知',
//                 text: `
// # <font color="#ff7f50">流水线通知</font> \n ---
// - **项目：** ${req.body.project.name}
// - **分支**：${req.body.object_attributes.ref}
// - **流水线**：${req.body.commit.message}
// * **状态**：<font color="red">${req.body.object_attributes.status}</font>
// - **触发用户**：${req.body.user.name}
// - ## [查看详情](${req.body.object_attributes.url})`
//             }
//         };

    // }

    // 返回200响应，表示 Webhook 请求已成功处理
    res.status(200).send('Webhook received');
});

// 启动服务器
app.listen(port, () => {
    console.log(`Webhook 服务器正在监听 ${port} 端口...`);
});
