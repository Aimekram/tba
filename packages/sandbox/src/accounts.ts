import { Client } from '@atproto/lex'
import { PasswordSession } from '@atproto/lex-password-session'

export type SandboxAccount = Awaited<ReturnType<typeof createAccount>>

export async function createAccount(pdsUrl: string, name: string) {
  const handle = `${name}.test` as const
  const password = `${name}-password`
  const session = await PasswordSession.createAccount(
    { handle, email: `${name}@example.test`, password },
    { service: pdsUrl },
  )
  return { client: new Client(session), did: session.did, handle, password }
}
