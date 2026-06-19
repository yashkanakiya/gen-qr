<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-bold text-center text-gray-900 mb-4">Simple, Transparent Pricing</h1>
    <p class="text-center text-gray-600 mb-12">Choose the plan that fits your needs. All plans include core features.</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div v-for="plan in plans" :key="plan.name" class="bg-white p-8 rounded-2xl shadow-md border border-gray-100 flex flex-col">
        <h3 class="text-2xl font-bold text-gray-800">{{ plan.name }}</h3>
        <p class="mt-2 text-gray-500 text-sm">{{ plan.description }}</p>
        <div class="mt-4">
          <span class="text-4xl font-extrabold text-gray-900">${{ plan.price }}</span>
          <span class="text-gray-500">/ {{ plan.period }}</span>
        </div>
        <ul class="mt-6 space-y-2 flex-1">
          <li v-for="feature in plan.features" :key="feature" class="flex items-start">
            <i class="pi pi-check-circle text-green-500 mt-1 mr-2"></i>
            <span class="text-gray-600">{{ feature }}</span>
          </li>
        </ul>
        <button class="mt-8 w-full py-3 rounded-lg font-semibold" :class="plan.ctaClass" @click="handleCta(plan.name)">
          {{ plan.cta }}
        </button>
      </div>
    </div>
    <p class="mt-12 text-center text-gray-400 text-sm">* All plans are currently in demo mode. No charges will be applied.</p>
  </div>
</template>

<script lang="ts" setup>
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const plans = [
  {
    name: 'Starter',
    price: '0',
    period: 'month',
    description: 'Perfect for individuals and small projects.',
    features: ['Up to 50 QR codes', 'Basic customization', 'Standard analytics', 'No expiration'],
    cta: 'Get Started',
    ctaClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  },
  {
    name: 'Pro',
    price: '19',
    period: 'month',
    description: 'For professionals and growing businesses.',
    features: ['Unlimited QR codes', 'Advanced customization (logo, colors)', 'Detailed analytics', 'Bulk creation', 'Priority support'],
    cta: 'Choose Pro',
    ctaClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg'
  },
  {
    name: 'Enterprise',
    price: '49',
    period: 'month',
    description: 'For teams and large-scale campaigns.',
    features: ['All Pro features', 'Team collaboration', 'API access', 'Dedicated account manager', 'Custom branding'],
    cta: 'Contact Sales',
    ctaClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }
]

function handleCta(planName: any) {
  toast.add({ severity: 'info', summary: `Selected ${planName}`, detail: 'This is a demo. No payment required.', life: 3000 })
}
</script>