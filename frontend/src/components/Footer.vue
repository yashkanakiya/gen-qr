<!-- components/Footer.vue -->
<template>
  <footer class="bg-white/60 backdrop-blur-sm border-t border-gray-200 mt-auto">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="text-center sm:text-left">
          <p class="text-sm text-gray-600">© {{ new Date().getFullYear() }} Yash Kanakiya. All rights reserved.</p>
        </div>

        <div class="flex space-x-6">
          <a href="#" class="text-gray-500 hover:text-blue-600 transition-colors">
            <i class="pi pi-question-circle"></i>
            <span class="ml-1 text-sm">Help</span>
          </a>
          <a href="#" class="text-gray-500 hover:text-blue-600 transition-colors">
            <i class="pi pi-info-circle"></i>
            <span class="ml-1 text-sm">About</span>
          </a>
          <a href="#" class="text-gray-500 hover:text-blue-600 transition-colors">
            <i class="pi pi-envelope"></i>
            <span class="ml-1 text-sm">Contact</span>
          </a>
        </div>

        <div class="flex space-x-4">
          <a href="#" class="text-gray-400 hover:text-blue-600 transition-colors">
            <i class="pi pi-github text-lg"></i>
          </a>
          <a href="#" class="text-gray-400 hover:text-blue-600 transition-colors">
            <i class="pi pi-twitter text-lg"></i>
          </a>
          <a href="#" class="text-gray-400 hover:text-blue-600 transition-colors">
            <i class="pi pi-linkedin text-lg"></i>
          </a>
        </div>
      </div>

      <!-- Footer bottom bar with version -->
      <div class="mt-4 pt-4 border-t border-gray-200 text-center">
        <p class="text-xs text-gray-400">
          Version 1.0.0 | Made with <i class="pi pi-heart-fill text-red-500 text-xs"></i> Yash Kanakiya
        </p>
      </div>
    </div>
  </footer>
</template>