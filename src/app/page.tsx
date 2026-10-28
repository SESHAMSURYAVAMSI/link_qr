/* eslint-disable @next/next/no-html-link-for-pages */

import { ArrowUpRight, QrCode, ShieldCheck, Zap } from "lucide-react";
import QRGenerator from "@/components/QRGenerator";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#241000]">
      <header className="border-b border-orange-100 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EA580C] text-white shadow-lg shadow-orange-200">
              <QrCode size={25} />
            </div>
            <div>
              <span className="block text-xl font-extrabold tracking-tight">
                QR<span className="text-[#EA580C]">Studio</span>
              </span>
              <span className="text-xs text-stone-500">
                Simple. Fast. Yours.
              </span>
            </div>
          </a>

          <div className="hidden items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800 sm:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Free QR generator
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-14 sm:px-8 sm:pt-20">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-800 shadow-sm">
              <Zap size={16} />
              Create your QR in seconds
              <ArrowUpRight size={15} />
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Anything you share,
              <br />
              <span className="text-[#EA580C]">one scan away.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
              Turn links and text into beautiful QR codes. Customize
              your colors, preview instantly, and download a crisp
              PNG — completely free.
            </p>
          </div>

          <QRGenerator />

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 pb-8 sm:grid-cols-3">
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-orange-100 bg-white p-4">
              <Zap className="shrink-0 text-[#EA580C]" size={22} />
              <div>
                <p className="font-semibold">Instant generation</p>
                <p className="text-xs text-stone-500">
                  Live QR preview
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 rounded-2xl border border-orange-100 bg-white p-4">
              <ShieldCheck
                className="shrink-0 text-[#EA580C]"
                size={22}
              />
              <div>
                <p className="font-semibold">Privacy first</p>
                <p className="text-xs text-stone-500">
                  Browser-side generation
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 rounded-2xl border border-orange-100 bg-white p-4">
              <QrCode className="shrink-0 text-[#EA580C]" size={22} />
              <div>
                <p className="font-semibold">High resolution</p>
                <p className="text-xs text-stone-500">
                  PNG up to 1024 px
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-center text-sm text-stone-500 sm:flex-row sm:px-8">
          <p>
            © 2026 QR Studio. Made for easy
            sharing.
          </p>
          <p>Free to use · No login required</p>
        </div>
      </footer>
    </main>
  );
}
