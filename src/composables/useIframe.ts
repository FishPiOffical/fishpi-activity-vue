/**
 * iframe 模式检测
 */
export function useIframe() {
  const route = useRoute()

  const isIframe = computed(() => {
    return route.query.type === 'iframe' || window.self !== window.top
  })

  return { isIframe }
}
