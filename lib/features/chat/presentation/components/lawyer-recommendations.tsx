'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Check } from 'lucide-react'

interface Lawyer {
  name: string
  specialties: string[]
  rating: number
  phone?: string
  email?: string
  address?: string
  availability?: string
  experience?: string
  languages?: string[]
  image?: string
  location?: string
}

interface LawyerRecommendationsProps {
  lawyers: Lawyer[]
}

export function LawyerRecommendations({ lawyers }: LawyerRecommendationsProps) {

  return (
    <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Recommended Lawyers
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lawyers.map((lawyer, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
            {/* Profile Image Section */}
            <div className="relative">
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                {lawyer.image ? (
                  <img 
                    src={lawyer.image} 
                    alt={lawyer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-semibold text-gray-600">
                      {lawyer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
              </div>
              {/* Verified Badge */}
              <div className="absolute top-2 right-2">
                <Badge className="bg-red-500 text-white text-xs px-2 py-1 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  verifiziert
                </Badge>
              </div>
            </div>
            
            {/* Text Section */}
            <CardContent className="p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 text-lg mb-1">
                {lawyer.name}
              </h4>
              <p className="text-sm text-gray-600">
                {lawyer.location || 'Zurich, Switzerland'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500 text-center">
        <p>Qualified professionals ready to help.</p>
      </div>
    </div>
  )
}
