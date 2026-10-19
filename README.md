# Tiệm Sách — Bài thực hành Week 8

Ứng dụng React Native / Expo SDK 58, TypeScript, Expo Router, Context (auth và giỏ hàng), AsyncStorage và Axios. Giao diện tiếng Việt.

Workspace ban đầu chỉ có `App.tsx` mặc định; chưa có cửa hàng, navigation được sử dụng hay backend. Bài làm bổ sung chức năng ngay trong project này. `AGENTS.md` yêu cầu Expo Router nên các route đặt tại `src/app/`.

## Chạy trên VS Code / PowerShell

Yêu cầu Node.js >= 22.18 vì backend và bộ test đọc TypeScript trực tiếp; đã chạy với Node 24.

```powershell
cd T:\23000835_PhungMinhTri_Week8\BTTHWeek7
npm.cmd install
Copy-Item .env.example .env
npm.cmd run server
```

Mở terminal thứ hai cùng thư mục:

```powershell
npm.cmd run web
# Hoặc dùng Expo Go tương thích SDK 58 / development build:
npm.cmd start
```

Trong `.env`, đặt `EXPO_PUBLIC_API_URL`:

- Web trên máy tính: `http://localhost:3001`.
- Android Emulator: `http://10.0.2.2:3001`.
- Điện thoại thật: `http://<IPv4-LAN-của-máy-tính>:3001`. Dùng `ipconfig` lấy IPv4, kết nối cùng Wi-Fi và cho phép Node qua firewall khi hệ điều hành yêu cầu. `localhost` trên điện thoại là chính điện thoại.

Khởi động lại Expo sau khi sửa `.env`. Backend lắng nghe cổng 3001, có thể đổi qua biến `PORT` và cập nhật URL tương ứng. Trong PowerShell dùng `npm.cmd` / `npx.cmd` để tránh lỗi ExecutionPolicy chặn `.ps1`.

Danh mục sách gọi trực tiếp `https://6ad5b90148476c0785d99fea.mockapi.io/Book`. Biến `EXPO_PUBLIC_BOOK_API_URL` chỉ là URL gốc, không thêm `/Book`. `EXPO_PUBLIC_API_URL` vẫn trỏ tới backend demo cho auth/review/đơn hàng. Nếu đổi URL danh mục, đặt cùng biến `EXPO_PUBLIC_BOOK_API_URL` trong môi trường chạy backend để backend tính giá từ đúng nguồn.

Các lệnh thêm thư viện đã dùng:

```powershell
npx.cmd expo install expo-router expo-linking expo-constants expo-status-bar
npx.cmd expo install eslint eslint-config-expo --dev
```

AsyncStorage đã có sẵn, không cần cài thêm. Nếu bị thiếu: `npx.cmd expo install @react-native-async-storage/async-storage`.

## Chức năng và cách trình bày

1. Đăng nhập / đăng ký: kiểm tra từng ô email, mật khẩu tối thiểu 6 ký tự, xác nhận mật khẩu và họ tên; lỗi dưới ô; trạng thái gửi và khóa gửi lặp. Đăng ký demo trả token nên tự đăng nhập.
2. Phiên: lưu duy nhất token + user tại `bookstore.auth.v1` trong AsyncStorage, không lưu mật khẩu. Khi mở app gọi `GET /auth/me` xác minh token ở backend, hiển thị loading cho đến khi xong. Token demo có hạn 7 ngày. Phiên hỏng hoặc không xác minh được (kể cả mất mạng khi khôi phục) bị xóa và yêu cầu đăng nhập lại. Các request có token nhận 401 sẽ xóa phiên thống nhất. Đăng xuất gọi backend thu hồi token rồi xóa phiên cục bộ, kể cả khi mất mạng.
3. Checkout: khách nhấn Thanh toán đi Login với `returnTo=checkout`; đăng nhập / đăng ký thành công đi thẳng Checkout. Login thông thường về Home. Route Checkout có guard riêng cho truy cập trực tiếp. Chỉ chấp nhận đích `checkout`, bỏ qua đích tùy ý. Giỏ hàng trong Context không bị xóa khi đăng nhập, đăng xuất hay 401.
4. Review: GET danh sách riêng, loading/error/empty state; tên người dùng, sao, bình luận. `RatingStars` nhận `value`, `size`; clamp 0–5 và xử lý NaN. Điểm trung bình tính từ review hợp lệ, không chia cho 0. Chỉ người đăng nhập có form; POST xác thực Bearer token; append duy nhất response đã lưu thành công, cập nhật trung bình ngay, không tải lại toàn trang. Gửi lỗi giữ form và không thêm review giả.
5. Sách liên quan: lọc cùng category, loại sách hiện tại theo id; FlatList ngang, bìa minh họa, tiêu đề, giá và điều hướng đúng sách.
6. Đơn hàng demo: backend kiểm tra phiên và tính lại giá theo danh mục, không tin tổng tiền client. Chỉ xóa giỏ sau khi đặt thành công. Không có cổng thanh toán thật.

## Backend và contract

**Danh mục đã nối API MockAPI do người dùng cung cấp:** `GET https://6ad5b90148476c0785d99fea.mockapi.io/Book` trả 10 sách khi kiểm tra. Adapter `src/services/catalog.ts` đổi `image` → `cover`, `categoryId` → `category`, chuẩn hóa giá. Sách liên quan so sánh cùng categoryId. Không dùng danh mục 5 sách demo cũ nữa.

Response hiện không có `id` và `GET /Book/1` trả 404. Vì vậy chi tiết tải danh sách `/Book` và tìm theo khóa ổn định được tạo từ cặp title/author, không giả định `/Book/:id` tồn tại. Nếu API bổ sung `id`, adapter ưu tiên id đó. Không dùng vị trí mảng làm khóa nên đổi thứ tự danh sách không làm sai sách. Nếu sửa tên/tác giả khi chưa có id, khóa sẽ thay đổi và review cũ không tự chuyển sang khóa mới; nên bổ sung id thật ở MockAPI. Không sửa dữ liệu trên MockAPI trong lần tích hợp này.

`server/server.mjs` vẫn là backend demo riêng cho auth, review và đơn hàng; chưa được cung cấp API xác thực/review production. Backend đọc cùng danh mục MockAPI để xác nhận sách và tính giá, không còn dùng giá sách demo cũ. Không có tài khoản/mật khẩu mặc định; hãy đăng ký tài khoản mới. Điểm `rating` có sẵn trong danh mục không được trộn vào trung bình review: trung bình được tính từ danh sách review đã lưu cho đúng sách.

| Method | Endpoint | Request / Response |
|---|---|---|
| POST | `/auth/register` | `{name,email,password}` → `{token,user}` (201), email trùng: 409 |
| POST | `/auth/login` | `{email,password}` → `{token,user}`, sai thông tin: 401 |
| GET | `/auth/me` | Bearer token → `{id,name,email}`, phiên lỗi/hết hạn: 401 |
| POST | `/auth/logout` | Bearer token → `{ok:true}`, thu hồi token |
| GET | `/books` | Backend chuyển tiếp danh mục MockAPI đã chuẩn hóa; UI gọi trực tiếp `/Book` trên MockAPI |
| GET | `/books/:id` | Backend tìm sách theo khóa đã chuẩn hóa; không có: 404 |
| GET | `/books/:id/reviews` | `Review[]` |
| POST | `/books/:id/reviews` | Bearer + `{rating:1..5,content}` → review đã lưu (201) |
| POST | `/orders` | Bearer + `{items:[{bookId,quantity}]}` → `{id,total}` (201) |

Lỗi có dạng `{message}`. `User`, `AuthResponse`, `Book`, `Review` nằm trong `src/types.ts`. Review demo dùng đúng trường `rating` và `content` nên không cần đổi tên trường. Mật khẩu được băm scrypt với salt riêng; token ngẫu nhiên được backend kiểm tra theo thời hạn. Dữ liệu tài khoản, phiên, review, đơn hàng lưu `server/data/db.json` (gitignore); giữ được sau khi restart backend. Không log mật khẩu/token. Không dùng dữ liệu thật cho demo HTTP; backend này chưa có TLS, rate limiting hay database production.

Để thay backend: đặt URL trong `.env`, sửa `src/services/api.ts` theo endpoint/HTTP/payload thực tế và chuẩn hóa response về các type chung. Backend mới phải hỗ trợ xác minh phiên và bảo vệ POST ở phía server. Không chỉ thay URL nếu contract khác. UI và auth store chỉ gọi service, không hardcode endpoint trong màn hình.

## File tạo / sửa

| File | Mục đích |
|---|---|
| `src/app/_layout.tsx` | Providers, loading khôi phục phiên, Stack |
| `src/app/index.tsx` | Home, danh mục, tài khoản, đăng xuất |
| `src/app/login.tsx` | Form đăng nhập / đăng ký và redirect allowlist |
| `src/app/book/[id].tsx` | Chi tiết và sách liên quan |
| `src/app/cart.tsx` | Giỏ hàng và yêu cầu thanh toán |
| `src/app/checkout.tsx` | Guard và xác nhận đơn demo |
| `src/components/BookReviews.tsx` | Danh sách / form review |
| `src/components/RatingStars.tsx` | Sao dùng lại ở chế độ xem / chọn |
| `src/components/ui.tsx` | Page, Field, Button, BookCard, styles |
| `src/store/auth.tsx` | Login, register, restoreSession, logout, AsyncStorage |
| `src/store/cart.tsx` | Giỏ hàng dùng chung giữa các route |
| `src/services/api.ts` | Axios, Bearer token, xử lý 401, service |
| `src/services/catalog.ts` | Chuẩn hóa schema MockAPI và tạo khóa khi nguồn chưa có id |
| `src/types.ts`, `src/utils/validation.ts` | Type chung, validation, tính trung bình |
| `server/server.mjs`, `server/server.test.mjs` | Backend demo và integration test HTTP |
| `tests/validation.test.mjs` | Test validation và tính trung bình |
| `index.ts`, `App.tsx`, `app.json` | Entry và cấu hình Router |
| `package.json`, `package-lock.json`, `eslint.config.js` | Dependencies và lệnh kiểm tra |
| `.env.example`, `.gitignore`, `README.md` | URL mẫu, bỏ dữ liệu cục bộ khỏi Git, hướng dẫn |

## Kiểm tra

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd expo-doctor
npx.cmd expo export --platform web
npx.cmd expo export --platform android
```

Đã chạy: TypeScript đạt; lint đạt; 7 test tự động đạt; Expo Doctor 20/20 đạt; xuất bundle web và Android thành công (không phải APK). Backend khởi động bằng `npm.cmd run server` và GET `/books` trả 5 sách. Test HTTP dùng backend và dữ liệu tạm riêng, không ảnh hưởng tài khoản demo. Các test kiểm tra validation server, đăng ký/trùng email/login sai, xác minh/thu hồi/hết hạn token, review không được phép/không hợp lệ/lưu đúng sách, checkout bảo vệ và tính giá server, lưu dữ liệu qua khởi động lại, băm mật khẩu; test utility kiểm tra form và trung bình.

**Chưa chạy thao tác UI tự động hay kiểm thử trên thiết bị Android/iOS thật.** Dùng bảng dưới để demo và nghiệm thu giao diện; các dòng chưa được click thử không được coi là UI test đã pass.

Sau khi nối MockAPI: chạy lại typecheck và lint đều đạt, 8/8 test đạt (thêm kiểm tra mapping dữ liệu và khóa ổn định khi đổi thứ tự). Kiểm tra HTTP trực tiếp qua backend dùng nguồn MockAPI trả 10 sách; chi tiết và danh sách review theo khóa sách mới đều trả 200. Chưa xuất lại bundle sau lần đổi nguồn API này.

| ID | Thao tác demo | Kết quả cần quan sát |
|---|---|---|
| TC01 | Login email `abc`, nhấn gửi | Lỗi ngay dưới email; sửa email thì lỗi được xóa |
| TC02 | Password `123`, nhấn gửi | Lỗi ngay dưới mật khẩu |
| TC03 | Đăng ký tài khoản mới; logout rồi login đúng | Home hiển thị tên; AsyncStorage có token/user |
| TC04 | Login sai; hoặc tắt backend rồi login | Báo sai thông tin / kết nối; không tạo phiên giả |
| TC05 | Login đúng, đóng/mở lại app khi backend hoạt động | Loading khởi tạo rồi Home có tên; `/auth/me` xác minh |
| TC06 | Đổi token trong AsyncStorage thành giá trị sai; mở app | Xóa phiên lỗi; yêu cầu login lại |
| TC07 | Bấm Đăng xuất trên Home | Không còn tên / token / user; giỏ vẫn giữ |
| TC08 | Chưa login: thêm sách → Giỏ → Thanh toán → login | Đi thẳng Checkout, đúng sách và số lượng |
| TC09 | Đã login: Giỏ → Thanh toán | Đi thẳng Checkout |
| TC10 | Login từ Home, không có returnTo | Quay về Home |
| TC11 | Mở sách chưa ai đánh giá | “Chưa có đánh giá”, không NaN |
| TC12 | Gửi hai đánh giá 5 và 4 sao | Hai review, trung bình 4.5 |
| TC13 | Logout rồi mở chi tiết | Chỉ hiện lời mời login; không có POST review |
| TC14 | Login; chọn sao; bình luận; gửi | Review xuất hiện một lần, điểm đổi ngay, form reset |
| TC15 | Đã tải sách/review rồi dừng backend; gửi review | Báo kết nối; không thêm đánh giá giả; nội dung còn để thử lại |
| TC16 | Chi tiết sách → Sách liên quan | Cùng danh mục, không chứa sách hiện tại, kéo ngang / mở đúng sách |

Kiểm tra bổ sung: mở trực tiếp `/checkout` khi chưa login để thử guard; mở `/login?returnTo=https://example.com` rồi đăng nhập phải về Home. Để demo hết hạn thực sự, sửa `expiresAt` của phiên trong file demo về `0` khi backend đã dừng rồi chạy lại. Để thử giỏ không bị mất do 401, giữ app đang mở và làm token hết hạn bên backend trước khi gửi đơn/review.

Giới hạn: giỏ hàng nằm trong bộ nhớ, giữ khi chuyển màn hình và đổi phiên nhưng mất khi đóng hoàn toàn app; danh mục và ảnh cần mạng; auth, review và đơn hàng vẫn dùng backend demo. Review cũ của danh mục demo có id 1–5 không được gắn nhầm vào sách MockAPI. npm install có báo 26 cảnh báo dependency (7 moderate, 19 high); chưa dùng `audit fix --force` vì có thể thay đổi phiên bản SDK. Chưa triển khai backend production hoặc thanh toán tiền thật.

Tài liệu đối chiếu: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [cài Expo Router](https://docs.expo.dev/router/installation/), [React Native TextInput](https://reactnative.dev/docs/textinput), [FlatList](https://reactnative.dev/docs/flatlist).
