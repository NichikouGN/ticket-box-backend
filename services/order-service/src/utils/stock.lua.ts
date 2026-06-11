/**
 * Lua scripts for managing stock reservations in Redis.
 * @description These scripts are used to atomically reserve and release stock for ticket purchases.
 * It first checks if the requested quantities are available and do not exceed user limits,
 * then updates the stock and purchased counts accordingly.
 */
export const reserveStockLua = `
local itemCount = tonumber(ARGV[1])
local argIndex = 2

for i = 1, itemCount do
  local stockKey = KEYS[(i - 1) * 2 + 1]
  local purchasedKey = KEYS[(i - 1) * 2 + 2]

  local ticketTypeId = ARGV[argIndex]
  local quantity = tonumber(ARGV[argIndex + 1])
  local maxPerUser = tonumber(ARGV[argIndex + 2])

  local available = tonumber(redis.call('HGET', stockKey, ticketTypeId) or '-1')
  local purchased = tonumber(redis.call('GET', purchasedKey) or '0')

  if available < quantity or purchased + quantity > maxPerUser then
    return { 'FAILED' }
  end

  argIndex = argIndex + 3
end

argIndex = 2

for i = 1, itemCount do
  local stockKey = KEYS[(i - 1) * 2 + 1]
  local purchasedKey = KEYS[(i - 1) * 2 + 2]
  
  local ticketTypeId = ARGV[argIndex]
  local quantity = tonumber(ARGV[argIndex + 1])

  redis.call('HINCRBY', stockKey, ticketTypeId, -quantity)
  redis.call('INCRBY', purchasedKey, quantity)

  argIndex = argIndex + 3
end

return { 'SUCCESS' }
`;

export const releaseStockLua = `
local itemCount = tonumber(ARGV[1])
local argIndex = 2

for i = 1, itemCount do
  local stockKey = KEYS[(i - 1) * 2 + 1]
  local purchasedKey = KEYS[(i - 1) * 2 + 2]
  local ticketTypeId = ARGV[argIndex]
  local quantity = tonumber(ARGV[argIndex + 1])

  redis.call('HINCRBY', stockKey, ticketTypeId, quantity)
  redis.call('DECRBY', purchasedKey, quantity)

  argIndex = argIndex + 3
end

return { 'SUCCESS' }
`;
