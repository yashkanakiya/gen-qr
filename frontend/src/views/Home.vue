<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <!-- Hero -->
      <div class="text-center max-w-4xl mx-auto">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
          Generate
          <span class="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600"
            >Dynamic QR Codes</span
          >
          in Seconds
        </h1>
        <p class="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          Create, manage, and track QR codes for your business, campaigns, or personal use. No
          design skills needed – just paste your link and get a branded QR code instantly.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <router-link
            to="/signup"
            class="px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Get Started Free
          </router-link>
          <router-link
            to="/pricing"
            class="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200"
          >
            View Pricing
          </router-link>
        </div>
      </div>

      <!-- Features -->
      <div class="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div class="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <div
            class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl mx-auto"
          >
            <i class="pi pi-qrcode"></i>
          </div>
          <h3 class="mt-4 text-xl font-semibold text-center">Customizable Designs</h3>
          <p class="mt-2 text-gray-500 text-center">
            Add your logo, choose colors, and style your QR codes to match your brand.
          </p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <div
            class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl mx-auto"
          >
            <i class="pi pi-chart-line"></i>
          </div>
          <h3 class="mt-4 text-xl font-semibold text-center">Real‑time Analytics</h3>
          <p class="mt-2 text-gray-500 text-center">
            Track scans, location, and device data to measure your campaign performance.
          </p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <div
            class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl mx-auto"
          >
            <i class="pi pi-shield"></i>
          </div>
          <h3 class="mt-4 text-xl font-semibold text-center">Secure & Reliable</h3>
          <p class="mt-2 text-gray-500 text-center">
            Your data is encrypted and stored safely. QR codes never expire.
          </p>
        </div>
      </div>

      <!-- Final CTA -->
      <div class="mt-20 text-center">
        <p class="text-2xl font-semibold text-gray-800">Ready to start creating?</p>
        <router-link
          to="/signup"
          class="inline-block mt-4 px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Sign Up Now – It's Free
        </router-link>
      </div>
    </div>
  </div>
</template>
