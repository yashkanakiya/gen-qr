<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { currentUser, profileImage, setProfileImage, updateUserUsername } from '../stores/authStore'

const toast = useToast()

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const username = ref('')
const email = ref('')
const imagePreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const getInitials = (name: string): string => {
  if (!name) return '?'
  const trimmed = name.trim()
  if (trimmed.length === 0) return '?'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  const first = parts[0]?.[0] || ''
  const second = parts[1]?.[0] || ''
  const combined = (first + second).toUpperCase()
  return combined || parts[0].substring(0, 2).toUpperCase()
}

const initials = computed(() => {
  const name = username.value || currentUser.value?.username || 'User'
  return getInitials(name)
})

watch(() => props.visible, (visible) => {
  if (visible && currentUser.value) {
    username.value = currentUser.value.username
    email.value = currentUser.value.email
    imagePreview.value = profileImage.value
  }
}, { immediate: true })

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function triggerFileUpload() {
  fileInput.value?.click()
}

function saveProfile() {
  if (!currentUser.value) return

  if (username.value.trim() !== currentUser.value.username) {
    updateUserUsername(username.value.trim())
  }

  if (imagePreview.value !== profileImage.value) {
    setProfileImage(imagePreview.value)
  }

  toast.add({
    severity: 'success',
    summary: 'Profile Updated',
    detail: 'Your profile has been updated successfully.',
    life: 3000
  })

  emit('update:visible', false)
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(val) => emit('update:visible', val)"
    header="User Profile"
    :modal="true"
    :closable="true"
    class="w-full max-w-md"
  >
    <div class="flex flex-col items-center gap-6 p-4">
      <!-- Avatar -->
      <div class="relative">
        <div
          class="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg overflow-hidden"
        >
          <img
            v-if="imagePreview"
            :src="imagePreview"
            alt="Profile"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ initials }}</span>
        </div>
        <!-- Upload button -->
        <button
          @click="triggerFileUpload"
          class="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-50 transition"
        >
          <i class="pi pi-camera text-blue-600 text-sm"></i>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileSelected"
        />
      </div>

      <!-- Form -->
      <div class="w-full space-y-5 mt-1">
        <div class="field">
          <label for="username" class="block text-sm font-medium text-gray-700 mb-3">Username</label>
          <InputText
            id="username"
            v-model="username"
            class="w-full profile-input"
            placeholder="Your username"
          />
        </div>
        <div class="field mt-5">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-3">Email</label>
          <InputText
            id="email"
            v-model="email"
            disabled
            class="w-full bg-gray-50 profile-input"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 w-full mt-2">
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="closeDialog"
        />
        <Button
          label="Save"
          class="save-btn"
          @click="saveProfile"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.field {
  margin-bottom: 0;
}

/* Remove default PrimeVue focus ring if any and set blue border */
.profile-input :deep(.p-inputtext) {
  border-color: #d1d5db; /* default gray */
  transition: border-color 0.2s, box-shadow 0.2s;
}
.profile-input :deep(.p-inputtext:enabled:focus) {
  border-color: #3b82f6; /* blue-500 */
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
.profile-input :deep(.p-inputtext:enabled:hover) {
  border-color: #60a5fa; /* blue-400 */
}

/* Save button with gradient */
.save-btn {
  background: linear-gradient(to right, #2563eb, #4f46e5) !important; /* from-blue-600 to-indigo-600 */
  border: none !important;
  color: white !important;
}
.save-btn:hover {
  background: linear-gradient(to right, #1d4ed8, #4338ca) !important; /* darker on hover */
  transform: scale(1.02);
  transition: all 0.2s;
}
.save-btn:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
</style>