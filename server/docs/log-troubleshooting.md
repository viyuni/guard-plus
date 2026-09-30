# 日志持久化与排查

## 日志存储与轮转

生产服务同时输出两份日志：

| 日志                 | 位置                                                   | 轮转与保留                                 | 容器重建后                   |
| -------------------- | ------------------------------------------------------ | ------------------------------------------ | ---------------------------- |
| Docker stdout/stderr | Docker 管理，通过 `docker logs` 查看                   | `local` 驱动，20MB × 10，压缩旧文件        | 旧容器日志不作为历史保留     |
| 业务 JSON 日志       | 宿主机 `/home/guard-plus-data/logs/{admin,user,event}` | 每天或达到 20MB 时轮转，总共保留 10 个文件 | 保留，直到轮转清理或手动删除 |

业务日志文件形如 `app.2026-09-30.1.log`。每个服务最多约 200MB，三个服务约
600MB；单条日志和异步批量写入可能使文件略超阈值。保留数量不等于保留天数：高流量
会更快轮转，低流量按天轮转。旧文件清理发生在轮转时，包括前一次进程留下的匹配文件。
文件日志未压缩。数据库、Redis、db-push 和 Uptime Kuma 的日志仍仅由 Docker 管理。

以下变量可在 `server/.env.prod` 配置：

```dotenv
LOG_LEVEL=info
LOG_PATH=/home/guard-plus-data/logs
LOG_MAX_SIZE_MB=20
LOG_MAX_FILES=10
```

`LOG_PATH` 必须是部署宿主机的绝对路径。Compose 为三个服务分别挂载子目录，
容器内统一为 `/app/logs`，并设置 `LOG_DIRECTORY=/app/logs`。单个目录只允许一个服务进程
写入；扩容时应按实例区分目录。容器必须有目录写权限。

本地开发默认只输出控制台日志；需要文件日志时，在 `server/.env` 中设置
`LOG_DIRECTORY=./logs`。日志配置在启动时生效，部署需要重建镜像和服务。
依赖容器、卷和环境变量均由现有 `vpr @server/app#deploy` 任务处理；本文的查询命令不会部署。

文件写入通过 Pino transport 工作线程处理；正常退出由容器依赖图关闭日志器并排空缓冲。
强制杀进程、宿主机断电和磁盘故障可能丢失尚未写出的日志。文件日志不是数据库审计记录。
启动错误、未捕获异常及直接写 stderr 的内容应同时查看 Docker 日志。

## 常用查询

以下命令在 Linux 部署宿主机执行，Compose 命令从项目根目录执行。

```bash
# 最近 30 分钟的日志，带 Docker 时间戳
docker compose --env-file server/.env.prod -f server/compose.prod.yml logs \
  --since 30m --tail 300 --timestamps admin-server user-server event-server

# 实时查看事件消费
docker compose --env-file server/.env.prod -f server/compose.prod.yml logs \
  -f --tail 100 event-server

# 确认 Docker 驱动、轮转配置与业务日志挂载
docker inspect --format '{{json .HostConfig.LogConfig}}' event-server
docker inspect --format '{{json .Mounts}}' event-server

# 查看持久化文件和磁盘占用
ls -lh /home/guard-plus-data/logs/{admin,user,event}/
du -sh /home/guard-plus-data/logs/*

# 搜索一次 HTTP 请求、事件或订单，包括旧容器留下的文件
grep -hF '替换为关联ID' /home/guard-plus-data/logs/{admin,user,event}/*.log

# 安装 jq 后，可按结构化字段筛选
jq -c 'select(.biliEventId == "替换为事件ID")' /home/guard-plus-data/logs/event/*.log
jq -c 'select(.level >= 40)' /home/guard-plus-data/logs/{admin,user,event}/*.log
```

自定义 `LOG_PATH` 时替换上述宿主机路径。`*.log` 包括所有轮转文件；
文件序号超过 9 后不能依赖文件名的字典顺序判断时间，应查看 JSON 中的毫秒时间戳 `time`。

## HTTP 请求失败

1. 在响应头找到 `X-Request-Id`，按 JSON 字段 `requestId` 搜索。
2. `http.request.completed` 包含方法、路径、状态码、耗时和已解析的 `actorId`、`actorRole`。
3. `http.validation.rejected` 是参数校验失败；`http.business.failed` 包含业务错误码；
   `http.request.failed` 包含异常信息和堆栈。

请求 ID 由服务生成，响应通过 CORS 暴露该头。当前它关联请求完成与 HTTP 异常日志；
尚未自动传播到业务调用或后台任务。进一步定位需结合业务 ID、操作者与时间。
日志不记录完整请求体、查询参数、Cookie 或 Authorization。

## 大航海奖励未到账

以 `biliEventId` 查询：

| 事件                                                 | 含义与下一步                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| `bili.guard.enqueued`                                | 事件已持久化，等待 worker 抢占                                       |
| `bili.guard.duplicate`                               | 外部重复事件被跳过                                                   |
| `bili.guard.enqueue.failed`                          | 入队失败，先检查数据库与事件源日志                                   |
| `bili.guard.claimed`                                 | 已抢占，`claimId` 区分不同尝试                                       |
| `bili.guard.plan.saved`                              | 已保存奖励计划，`rewardCount` 为奖励条目数量                         |
| `reward.grant.committed`                             | 奖励事务已提交，查看 `rewards` 的规则、积分、流水 ID 与 `duplicated` |
| `bili.guard.succeeded`                               | 任务成功状态已保存                                                   |
| `bili.guard.ignored`                                 | 事件被业务规则忽略，查看 `reason`，例如用户未注册                    |
| `bili.guard.processing.failed`                       | 本次处理失败，查看 `err`                                             |
| `bili.guard.retry.scheduled`                         | 失败已保存，将在 `nextRetryAt` 后重试                                |
| `bili.guard.retry.exhausted`                         | 已达到自动重试上限，需要修复原因后通过管理端回放                     |
| `bili.guard.lease.lost`                              | 保存失败时租约已变更，检查同事件的其他 `claimId`                     |
| `bili.guard.lease.failed` / `bili.guard.poll.failed` | 租约续期或轮询异常，检查数据库可用性                                 |

零奖励条目可能是没有匹配规则，并不代表任务异常。`duplicated=true` 表示积分流水已存在，
本次命中幂等保护。奖励提交成功与任务状态保存成功是两个节点；后者失败后重试应复用积分流水。
手动补录与回放使用 `reward.event.*`、`reward.replay.started`，同样以 `biliEventId` 查询。

## 订单兑换、退款与积分变更

- `order.create.started`：开始兑换，包含用户和商品 ID。没有后续提交日志时，结合相近时间
  的 HTTP 异常与错误码排查。并发操作时不能仅靠时间认定属于同一次请求。
- `order.create.committed`：订单、积分扣减和库存变更已提交，包含订单 ID、订单号和积分流水 ID。
- `order.refund.started` / `order.refund.committed`：退款开始与事务提交，提交日志包含返还流水 ID。
- `order.complete.committed`：完成订单状态已提交。
- `point.conversion.committed`：积分转换已提交，包含来源扣减与目标增加的流水 ID，以及幂等结果。
- `point.adjustment.committed`：人工调整已提交，包含管理员、用户、积分类型、数量和流水 ID。

`*.committed` 仅在事务完成后输出。不存在成功日志不能单独证明操作未执行，需对照数据库流水；
日志写出本身也可能遇到进程崩溃或磁盘故障。

## 订单通知失败

按 `orderNo` 查询：

- `notification.enqueued`：已入队。
- `notification.enqueue.failed`：订单已提交，但通知入队失败；检查队列运行环境。
- `notification.sent`：发送完成，只记录收件人数量。
- `notification.skipped`：未配置通知收件人。
- `notification.send.failed`：本次发送失败，异常继续交给队列重试；检查 SMTP 配置与网络。

入队失败不会回滚已经提交的兑换订单。通知队列仍使用现有 Bunqueue embedded 模式，
文件日志持久化不改变其任务恢复语义。

## 日志中不应出现的数据

不记录密码、访问或刷新令牌、收货信息、邮件正文、原始弹幕及完整业务快照。
日志器会脱敏指定结构化凭据字段；异常只序列化类型、消息、堆栈和错误码，不展开 SQL 参数
或附加属性。自由文本异常消息仍需在产生处避免包含敏感值。

## 参考

- [Docker local logging driver](https://docs.docker.com/engine/logging/drivers/local/)
- [Pino transports](https://github.com/pinojs/pino/blob/main/docs/transports.md)
- [pino-roll 轮转与保留配置](https://github.com/mcollina/pino-roll)
