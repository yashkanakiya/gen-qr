<template>
  <footer class="bg-white/60 backdrop-blur-sm border-t border-gray-200 mt-auto">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col items-center gap-4">
        <div class="text-center">
          <p class="text-sm text-gray-600">© {{ new Date().getFullYear() }} Yash Kanakiya. All rights reserved.</p>
        </div>

        <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <router-link to="/pricing" class="text-gray-500 hover:text-blue-600 transition-colors text-sm">
            <i class="pi pi-tag mr-1"></i> Pricing
          </router-link>
          <router-link to="/faq" class="text-gray-500 hover:text-blue-600 transition-colors text-sm">
            <i class="pi pi-question-circle mr-1"></i> FAQ
          </router-link>
          <router-link to="/contact" class="text-gray-500 hover:text-blue-600 transition-colors text-sm">
            <i class="pi pi-envelope mr-1"></i> Contact
          </router-link>
          <router-link to="/terms" class="text-gray-500 hover:text-blue-600 transition-colors text-sm">
            <i class="pi pi-file mr-1"></i> Terms
          </router-link>
          <router-link to="/privacy" class="text-gray-500 hover:text-blue-600 transition-colors text-sm">
            <i class="pi pi-lock mr-1"></i> Privacy
          </router-link>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-200 text-center">
        <p class="text-xs text-gray-400">
          Version 1.0.0 | Made with <i class="pi pi-heart-fill text-red-500 text-xs"></i> by Yash Kanakiya
        </p>
      </div>
    </div>
  </footer>
</template>