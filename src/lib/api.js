// 공공데이터 API 호출 함수들

const API_KEY = import.meta.env.VITE_HOLIDAY_API_KEY

// 공휴일 정보 가져오기
export const fetchHolidays = async (year) => {
  try {
    const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${year}&ServiceKey=${API_KEY}&_type=json&numOfRows=100`
    const response = await fetch(url)
    const data = await response.json()
    
    const holidays = {}
    if (data.response?.body?.items?.item) {
      const items = Array.isArray(data.response.body.items.item) 
        ? data.response.body.items.item 
        : [data.response.body.items.item]
      
      items.forEach(item => {
        const date = item.locdate.toString()
        const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
        holidays[formattedDate] = item.dateName
      })
    }
    return holidays
  } catch (error) {
    console.error('공휴일 데이터 로드 실패:', error)
    return {}
  }
}

// 양력 -> 음력 변환
export const convertSolarToLunar = async (solarDate) => {
  try {
    const [year, month, day] = solarDate.split('-')
    const url = `https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getSolToLunInfo?solYear=${year}&solMonth=${month}&solDay=${day}&ServiceKey=${API_KEY}&_type=json`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.response?.body?.items?.item) {
      const item = data.response.body.items.item
      return `${item.lunMonth}.${item.lunDay}`
    }
    return ''
  } catch (error) {
    console.error('음력 변환 실패:', error)
    return ''
  }
}
