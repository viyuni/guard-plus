## v0.0.1-beta.5

[compare changes](https://github.com/viyuni/guard-plus/compare/v0.0.1-beta.4...v0.0.1-beta.5)

### 🚀 Enhancements

- **docs:** Initialize documentation ([c3b31b8](https://github.com/viyuni/guard-plus/commit/c3b31b8))
- **docs:** Add i18n support, mobile header, changelog, and UI refinements ([720fc43](https://github.com/viyuni/guard-plus/commit/720fc43))
- **docker:** Add production builds for user web app ([a943198](https://github.com/viyuni/guard-plus/commit/a943198))
- **web:** Migrate admin and user to static SPA ([#15](https://github.com/viyuni/guard-plus/pull/15))
- **server:** Add redis password authentication ([68021f4](https://github.com/viyuni/guard-plus/commit/68021f4))

### 🩹 Fixes

- **server:** Remove extra prod compose services ([e618eae](https://github.com/viyuni/guard-plus/commit/e618eae))
- **web:** Sync auth state after login ([97bd4c5](https://github.com/viyuni/guard-plus/commit/97bd4c5))
- **web:** Clear auth state on logout ([afbd7c8](https://github.com/viyuni/guard-plus/commit/afbd7c8))
- **web/user:** Sync session after user mutations ([3c54ac3](https://github.com/viyuni/guard-plus/commit/3c54ac3))
- **web/user:** Sync session after user mutations" ([d386b61](https://github.com/viyuni/guard-plus/commit/d386b61))
- **web:** Reload after auth changes ([b5fb382](https://github.com/viyuni/guard-plus/commit/b5fb382))
- **event:** Handle guard event jobs in event app ([67e16b2](https://github.com/viyuni/guard-plus/commit/67e16b2))
- **event:** Add missing startup environment variables ([b6022cd](https://github.com/viyuni/guard-plus/commit/b6022cd))
- **event:** Remove stale ImageEnv type dependency ([c2cd3f1](https://github.com/viyuni/guard-plus/commit/c2cd3f1))
- **server:** Include uid in guard reward event id ([bb51d27](https://github.com/viyuni/guard-plus/commit/bb51d27))

### 💅 Refactors

- **web:** Migrate Vue type checking to Golar ([fae7286](https://github.com/viyuni/guard-plus/commit/fae7286))

### 🏡 Chore

- **release:** V0.0.1-beta.4 ([e0b5a9d](https://github.com/viyuni/guard-plus/commit/e0b5a9d))
- Update dependencies and centralize type checking with Golar ([8e3067f](https://github.com/viyuni/guard-plus/commit/8e3067f))
- **web-user:** Rename production Compose file to example ([b778c2b](https://github.com/viyuni/guard-plus/commit/b778c2b))
- **web-admin:** Add Docker and Nginx deployment config ([4da623c](https://github.com/viyuni/guard-plus/commit/4da623c))

### ❤️ Contributors

- Byc ([@YanChenBai](https://github.com/YanChenBai))

## v0.0.1-beta.4

[compare changes](https://github.com/viyuni/guard-plus/compare/v0.0.1-beta.3...v0.0.1-beta.4)

### 🩹 Fixes

- **test:** Limit CI test concurrency to prevent OOM ([a105284](https://github.com/viyuni/guard-plus/commit/a105284))
- **ci:** Align test container names with workflow ([de40c41](https://github.com/viyuni/guard-plus/commit/de40c41))
- **ci:** Run server test task by workspace name ([a9764b8](https://github.com/viyuni/guard-plus/commit/a9764b8))
- **ci:** Avoid duplicate runs for pull request branches ([1b62a96](https://github.com/viyuni/guard-plus/commit/1b62a96))

### 💅 Refactors

- **web/admin:** Centralize api access utility ([ffda631](https://github.com/viyuni/guard-plus/commit/ffda631))
- **web/admin:** Remove duplicate login mutation hook ([8ccd854](https://github.com/viyuni/guard-plus/commit/8ccd854))
- **server:** Add alias for shared test helpers ([859acde](https://github.com/viyuni/guard-plus/commit/859acde))
- **server:** Improve dev runner with process filters and type watching ([32176d7](https://github.com/viyuni/guard-plus/commit/32176d7))

### 📖 Documentation

- Add project badges to README ([f315819](https://github.com/viyuni/guard-plus/commit/f315819))
- Add Chinese README ([6ed8158](https://github.com/viyuni/guard-plus/commit/6ed8158))

### 📦 Build

- **config:** Add production deploy task ([d1279d0](https://github.com/viyuni/guard-plus/commit/d1279d0))
- **config:** Update vite plus tasks ([5726031](https://github.com/viyuni/guard-plus/commit/5726031))
- **config:** Prepare server types before check ([b494216](https://github.com/viyuni/guard-plus/commit/b494216))

### 🏡 Chore

- **server:** Reorganize compose files and add workflow scripts ([66a7445](https://github.com/viyuni/guard-plus/commit/66a7445))

### ✅ Tests

- **server:** Enable smol test mode ([d486dc8](https://github.com/viyuni/guard-plus/commit/d486dc8))
- **server:** Stabilize integration test resources ([c13cc4f](https://github.com/viyuni/guard-plus/commit/c13cc4f))

### 🤖 CI

- **config:** Add check and test workflow ([371dbb1](https://github.com/viyuni/guard-plus/commit/371dbb1))

### ❤️ Contributors

- Byc ([@YanChenBai](https://github.com/YanChenBai))

## v0.0.1-beta.3

[compare changes](https://github.com/viyuni/guard-plus/compare/v0.0.1-beta.2...v0.0.1-beta.3)

### 🩹 Fixes

- **web/admin:** Display point conversion type names ([44f5e69](https://github.com/viyuni/guard-plus/commit/44f5e69))
- **web/admin:** Sync point and reward switches ([838d6dc](https://github.com/viyuni/guard-plus/commit/838d6dc))

### ❤️ Contributors

- Byc ([@YanChenBai](https://github.com/YanChenBai))

## v0.0.1-beta.2

[compare changes](https://github.com/viyuni/guard-plus/compare/v0.0.1-beta.1...v0.0.1-beta.2)

### 🚀 Enhancements

- **web/user:** Add under review product covers ([def6186](https://github.com/viyuni/guard-plus/commit/def6186))
- **web/user:** Return bili room id with register code ([089b673](https://github.com/viyuni/guard-plus/commit/089b673))

### 🔥 Performance

- **web/user:** Enable home page swr ([af651a4](https://github.com/viyuni/guard-plus/commit/af651a4))

### 🩹 Fixes

- **server/app:** Hide default admin password outside development ([0c6174d](https://github.com/viyuni/guard-plus/commit/0c6174d))
- **server/app:** Ensure image assets directory exists ([dd35fdd](https://github.com/viyuni/guard-plus/commit/dd35fdd))
- **web/user:** Avoid fixed nitro preset ([29172c4](https://github.com/viyuni/guard-plus/commit/29172c4))
- **server:** Configure cors origins from env ([e04b645](https://github.com/viyuni/guard-plus/commit/e04b645))
- **server:** Pass prod CORS origins to app services ([ec13f9c](https://github.com/viyuni/guard-plus/commit/ec13f9c))
- **web/admin:** Read index version from root package ([7bcaea2](https://github.com/viyuni/guard-plus/commit/7bcaea2))

### 💅 Refactors

- **server/auth:** Split admin and user jwt secrets ([b2611bd](https://github.com/viyuni/guard-plus/commit/b2611bd))

### 📖 Documentation

- **changelog:** Remove empty placeholder comment ([cbcbacc](https://github.com/viyuni/guard-plus/commit/cbcbacc))

### 📦 Build

- **server:** Split test database push task ([4901c22](https://github.com/viyuni/guard-plus/commit/4901c22))
- **server:** Use pure bun docker image ([00a5ec2](https://github.com/viyuni/guard-plus/commit/00a5ec2))

### 🏡 Chore

- **config:** Ignore prod compose file ([da1c530](https://github.com/viyuni/guard-plus/commit/da1c530))
- **web/admin:** Add env example ([18762fb](https://github.com/viyuni/guard-plus/commit/18762fb))
- **config:** Ignore prod nginx config ([3a028f4](https://github.com/viyuni/guard-plus/commit/3a028f4))

### ❤️ Contributors

- Byc ([@YanChenBai](https://github.com/YanChenBai))

## v0.0.1-beta.1

### 🚀 Enhancements

- **user:** Add loading skeletons ([48a78b5](https://github.com/viyuni/guard-plus/commit/48a78b5))
- **web/admin:** Add landing page with changelog ([70ad9e8](https://github.com/viyuni/guard-plus/commit/70ad9e8))

### 🩹 Fixes

- **auth:** Allow bili register cookies on all paths ([4d2de8c](https://github.com/viyuni/guard-plus/commit/4d2de8c))
- **user:** Hide point actions without accounts ([96f9060](https://github.com/viyuni/guard-plus/commit/96f9060))
- **release:** Pass changelogen version directly ([d4ee34d](https://github.com/viyuni/guard-plus/commit/d4ee34d))

### 💅 Refactors

- **user:** Simplify point actions animation ([81a20c1](https://github.com/viyuni/guard-plus/commit/81a20c1))
- **user:** Move point actions to header dialog ([4193553](https://github.com/viyuni/guard-plus/commit/4193553))
- **web/base:** Share MiSheng head and fonts ([81b3ba2](https://github.com/viyuni/guard-plus/commit/81b3ba2))

### 📖 Documentation

- **config:** Update agent commit guidance ([db55c06](https://github.com/viyuni/guard-plus/commit/db55c06))
- **readme:** Center project title ([37f74af](https://github.com/viyuni/guard-plus/commit/37f74af))

### 📦 Build

- **deps:** Move dependencies to catalog ([5bc29fd](https://github.com/viyuni/guard-plus/commit/5bc29fd))

### 🏡 Chore

- **user:** Remove custom Nuxt build task ([b55cef1](https://github.com/viyuni/guard-plus/commit/b55cef1))
- **server:** Separate test postgres compose service ([df3482d](https://github.com/viyuni/guard-plus/commit/df3482d))
- **web:** Migrate frontend deps to catalog ([b39fac1](https://github.com/viyuni/guard-plus/commit/b39fac1))
- **user:** Update site favicon ([be0e59e](https://github.com/viyuni/guard-plus/commit/be0e59e))

### 🤖 CI

- **release:** Add changelogen release workflow ([03fcd79](https://github.com/viyuni/guard-plus/commit/03fcd79))

### ❤️ Contributors

- Byc ([@YanChenBai](https://github.com/YanChenBai))
