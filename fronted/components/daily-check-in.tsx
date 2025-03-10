"use client"

import { useState } from "react"
import { Gift } from "lucide-react"

interface DailyCheckInProps {
  balance: number
  onCheckIn: (points: number) => void
}

export default function DailyCheckIn({ balance, onCheckIn }: DailyCheckInProps) {
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  const handleCheckIn = () => {
    if (!isCheckedIn) {
      onCheckIn(1000)
      setIsCheckedIn(true)
    }
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <Gift className="text-yellow-400 mr-2" size={24} />
        <div>
          <span className="text-gray-200 font-medium block">Daily Check-In</span>
          <span className="text-sm text-gray-400">Balance: {balance} Points</span>
        </div>
      </div>
      <button
        onClick={handleCheckIn}
        disabled={isCheckedIn}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isCheckedIn
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-yellow-500 text-gray-900 hover:bg-yellow-600"
        }`}
      >
        {isCheckedIn ? "Claimed" : "Claim 1000 Points"}
      </button>
    </div>
  )
}

