local raw = redis.call('GET', KEYS[1])

if not raw then
  return 0
end

local session = cjson.decode(raw)

if session.refreshTokenId ~= ARGV[1] then
  return 0
end

session.refreshTokenId = ARGV[2]
redis.call('SET', KEYS[1], cjson.encode(session), 'EX', ARGV[3])

return 1
