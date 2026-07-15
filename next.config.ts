import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  
  // Menyesuaikan dengan nama repositori persis seperti di URL (Case Sensitive)
  basePath: '/Portfolio', 
  
  // Menonaktifkan optimasi gambar bawaan Next.js (Wajib untuk GitHub Pages / Static HTML)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;