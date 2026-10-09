import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "RiceGuard — Nền tảng An ninh mạng Nông nghiệp",
  description: "Giám sát, phát hiện và tự động ứng phó sự cố an ninh mạng cho hệ thống cảnh báo sớm dịch bệnh cây lúa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
