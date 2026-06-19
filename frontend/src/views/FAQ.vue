<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>
    <div class="space-y-6">
      <div v-for="(faq, index) in faqs" :key="index" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">{{ faq.question }}</h3>
        <p class="mt-2 text-gray-600">{{ faq.answer }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const faqs = [
  { question: 'What is Gen QR?', answer: 'Gen QR is a modern QR code generator that lets you create custom, branded QR codes with advanced tracking and analytics.' },
  { question: 'Is it free to use?', answer: 'Yes, we offer a free plan with basic features. For advanced customization and analytics, check our pricing page.' },
  { question: 'Can I track QR code scans?', answer: 'Absolutely. Each QR code comes with detailed analytics including total scans, location, and device type.' },
  { question: 'Do QR codes expire?', answer: 'No. Once created, your QR codes are permanent and will work forever unless you delete them.' },
  { question: 'How do I add my logo?', answer: 'During creation, you can upload your logo and it will be centered inside the QR code automatically.' }
]
</script>