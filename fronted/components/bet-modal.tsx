"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { formatUTCDate } from "../lib/date-utils"

type BetOption = {
  id: string
  text: string
  odds: number
}

type Topic = {
  id: string
  status: "live" | "next" | "expired" | "later"
  question: string
  settlementTime: string
  options: BetOption[]
  prizePool: number
}

type BetModalProps = {
  topic: Topic
  option: BetOption
  userPoints: number
  onClose: () => void
  onPlaceBet: (amount: number, calculatedOdds: number) => void
}

export default function BetModal({ topic, option, userPoints, onClose, onPlaceBet }: BetModalProps) {
  const [amount, setAmount] = useState<string>("")
  const [calculatedOdds, setCalculatedOdds] = useState<number>(option.odds)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)
  const [potentialWin, setPotentialWin] = useState<number>(0)

  // Calculate potential win when amount or odds change
  useEffect(() => {
    const numAmount = Number.parseFloat(amount) || 0
    setPotentialWin(numAmount * calculatedOdds)
  }, [amount, calculatedOdds])

  useEffect(() => {
    if (amount && Number.parseFloat(amount) > 0) {
      setIsCalculating(true)
      const timer = setTimeout(() => {
        // Simulate slight odds variation based on bet amount
        const variation = Math.random() * 0.05 - 0.025 // -0.025 to +0.025
        const newOdds = Math.max(1.01, option.odds + variation)
        setCalculatedOdds(Number.parseFloat(newOdds.toFixed(2)))
        setIsCalculating(false)
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [amount, option.odds])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const handleSubmit = () => {
    const numAmount = Number.parseFloat(amount)
    if (numAmount > 0 && numAmount <= userPoints) {
      onPlaceBet(numAmount, calculatedOdds)
    }
  }

  const isOptionUp = option.id === "a"
  const colorClass = isOptionUp ? "text-teal-400" : "text-pink-400"
  const bgColorClass = isOptionUp ? "bg-teal-600" : "bg-pink-600"
  const borderColorClass = isOptionUp ? "border-teal-600" : "border-pink-600"

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md overflow-hidden text-gray-100">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="font-bold">Place Bet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="font-medium">{topic.question}</p>
            <p className="text-sm text-gray-400 flex items-center mt-1">
              Settlement: {formatUTCDate(topic.settlementTime)}
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${borderColorClass} mb-4 bg-gray-700`}>
            <div className="flex justify-between items-center mb-2">
              <div className={`${bgColorClass} text-white text-xs px-2 py-0.5 rounded-md`}>
                {isOptionUp ? "UP" : "DOWN"}
              </div>
              <div className={`${colorClass} text-sm font-medium`}>
                {isCalculating ? "Calculating..." : `${calculatedOdds}x Payout`}
              </div>
            </div>
            <p className="text-gray-200">{option.text}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bet Amount (Available: {userPoints} Points)
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter amount"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-600 px-2 py-1 rounded text-xs"
                onClick={() => setAmount(userPoints.toString())}
              >
                MAX
              </button>
            </div>
          </div>

          <div className="bg-gray-700 p-3 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Potential Win:</span>
              <span className="font-bold">{potentialWin.toFixed(0)} Points</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              !amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > userPoints || isCalculating
            }
            className={`w-full py-3 rounded-lg text-white font-medium ${
              !amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > userPoints || isCalculating
                ? "bg-gray-600 cursor-not-allowed"
                : isOptionUp
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-pink-600 hover:bg-pink-700"
            }`}
          >
            Confirm Bet
          </button>
        </div>
      </div>
    </div>
  )
}

