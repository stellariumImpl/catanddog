import "../styles/index.css";
import { Providers } from "./providers";

export const metadata = {
  title: "老友记宠物收银系统",
  description: "专业 高效 智能",
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
