import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "books.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "www.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "books.google.com",
      },
      {
        protocol: "http",
        hostname: "books.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "www.googleapis.com",
      },
      {
        protocol: "http",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
