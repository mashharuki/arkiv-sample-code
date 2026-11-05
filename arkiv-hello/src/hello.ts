import { addr, bytes, createPublicClient, createWalletClient, dec, defineSchema, ExpirationTime, str } from "@arkiv-network/sdk"
import { rabdi } from "@arkiv-network/sdk/chains"
import { hexToString, http, stringToBytes, type Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"

// チェーンとアカウントの情報を読み取る
const chain = rabdi({ accessKey: process.env.ARKIV_ACCESS_KEY ?? "" })
const account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex)

// 読み込み処理と書き込み処理用のクライアントインスタンスを作成する
const publicClient = createPublicClient({ chain, transport: http() })
const walletClient = createWalletClient({ chain, transport: http(), account })

// 書き込むデータのスキーマを定義する(データベース名は my-app.posts)
const Posts = defineSchema("my-app.posts", {
  author: addr().indexed(),
  category: str().indexed(),
  score: dec().indexed(),
  title: str(),
  body: bytes(),
  summary: str().optional(),
})

// 書き込み処理を行う
const { entityKey } = await walletClient.createEntity(
  Posts,
  {
    author: addr(account.address),
    category: "intro",
    score: dec("4.5"),
    title: "Hello, Arkiv",
    body: stringToBytes("My first entity."),
  },
  { expiration: ExpirationTime.fromDays(1) },
)

console.log("Created", entityKey);

// 書き込んだPostを読み込む
const { entities } = await publicClient
  .select({ $key: true, title: true, body: true })
  .from(Posts)
  .ownedBy(account.address)
  .fetch()

for (const post of entities) {
  console.log(post.$key, post.title.value, hexToString(post.body.value))
}

