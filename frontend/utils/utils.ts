export async function heliusApi(method: string, params: any) {
  const response = await fetch(process.env.NEXT_PUBLIC_RPC_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "my-id",
      method,
      params,
    }),
  })
  const { result } = await response.json()
  return result
}
