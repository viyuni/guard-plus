-- ARGV[1] 用于选择一种原子状态迁移：
--   match:   pending -> matched，返回更新后的验证信息
--   consume: matched -> consumed，返回消费前的验证信息供注册流程使用
local raw = redis.call('GET', KEYS[1])
if not raw then
  return nil
end

local challenge = cjson.decode(raw)

if ARGV[1] == 'match' then
  if challenge.status ~= 'pending' then
    return nil
  end

  challenge.status = 'matched'
  challenge.biliUid = ARGV[2]
  challenge.biliName = ARGV[3]
  challenge.matchedAt = ARGV[4]
  raw = cjson.encode(challenge)
elseif ARGV[1] == 'consume' then
  if challenge.status ~= 'matched' or challenge.verifierHash ~= ARGV[2] or not challenge.biliUid then
    return nil
  end

  challenge.status = 'consumed'
  challenge.consumedAt = ARGV[3]
else
  return nil
end

local ttl = redis.call('TTL', KEYS[1])
if ttl <= 0 then
  return nil
end

redis.call('SET', KEYS[1], cjson.encode(challenge), 'EX', ttl)

return raw
