export async function runConcurrent<T>(
  count: number,
  task: (index: number) => Promise<T>,
): Promise<PromiseSettledResult<T>[]> {
  return await Promise.allSettled(Array.from({ length: count }, (_, index) => task(index)));
}

export function countFulfilled<T>(results: PromiseSettledResult<T>[]) {
  return results.filter(result => result.status === 'fulfilled').length;
}

export function countRejected<T>(results: PromiseSettledResult<T>[]) {
  return results.filter(result => result.status === 'rejected').length;
}
