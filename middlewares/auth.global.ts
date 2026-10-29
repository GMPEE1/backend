// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (process.server) return

  // รายการหน้า/พาธที่ต้องล็อกอินก่อนเข้า
  const protectedRoots = ['/', '/users', '/upload']
  const needAuth = protectedRoots.some(p => to.path === p || to.path.startsWith(p + '/'))

  if (needAuth && !auth.token) {
    return navigateTo('/login')
  }
})


