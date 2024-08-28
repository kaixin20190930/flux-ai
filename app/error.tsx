'use client'

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error
    reset: () => void
}) {
    return (
        <div>
            <h2>出错了！</h2>
            <button onClick={() => reset()}>重试</button>
        </div>
    )
}