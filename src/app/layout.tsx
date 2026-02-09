import "../styles/index.css";
import { Providers } from "./providers";

export const metadata = {
  title: "宠物店门店系统",
  description: "专业的门店管理解决方案",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
