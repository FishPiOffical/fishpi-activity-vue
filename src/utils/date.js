import dayjs from 'dayjs'

export const formatDate = (dateStr, includeTime = true) => {
    if (!dateStr) return ''
    const date = dayjs(dateStr)
    if (!date.isValid()) return dateStr

    return includeTime ? date.format('YYYY-MM-DD HH:mm:ss') : date.format('YYYY-MM-DD')
}

export const formatActivityDuration = (startStr, endStr) => {
    if (!startStr || !endStr) return ''

    const start = dayjs(startStr)
    const end = dayjs(endStr)

    // Check valid dates
    if (!start.isValid() || !end.isValid()) {
        return `${startStr} ~ ${endStr}`
    }

    // Check if full day (00:00:00 - 23:59:59)
    const isStartMidnight = start.format('HH:mm:ss') === '00:00:00'
    const isEndMidnight = end.format('HH:mm:ss') === '23:59:59'

    // If both conditions met, show Date only
    if (isStartMidnight && isEndMidnight) {
        return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
    }

    return `${start.format('YYYY-MM-DD HH:mm:ss')} ~ ${end.format('YYYY-MM-DD HH:mm:ss')}`
}

export const ACTIVITY_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    ENDED: 'ended'
}

export const getActivityStatus = (startStr, endStr) => {
    const now = dayjs()
    const start = dayjs(startStr)
    const end = dayjs(endStr)

    if (now.isBefore(start)) return ACTIVITY_STATUS.NOT_STARTED
    if (now.isAfter(end)) return ACTIVITY_STATUS.ENDED
    return ACTIVITY_STATUS.IN_PROGRESS
}
