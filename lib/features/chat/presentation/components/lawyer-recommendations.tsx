'use client'

import React from 'react'
import Image from 'next/image'
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
  // Generate different professional headshots for each lawyer
  const getLawyerImage = (lawyer: Lawyer, index: number) => {
    if (lawyer.image) return lawyer.image;
    
    // Different professional headshots from Unsplash
    const professionalImages = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face&auto=format&q=80',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=face&auto=format&q=80',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop&crop=face&auto=format&q=80',
      'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=300&fit=crop&crop=face&auto=format&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=300&fit=crop&crop=face&auto=format&q=80'
    ];
    
    return professionalImages[index % professionalImages.length];
  };

  return (
    <div className="mt-3 p-2  border-t border-blue-200 mt-10">
      <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Recommended Lawyers
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lawyers.map((lawyer, index) => (
          <Card key={index} className="p-0 pb-4 hover:cursor-pointer overflow-hidden shadow-none hover:shadow-md transition-shadow">
            {/* Profile Image Section */}
            <div className="relative">
              <div className="w-full h-28 bg-gray-200 flex items-center justify-center">
                <Image 
                  src={getLawyerImage(lawyer, index)} 
                  alt={lawyer.name}
                  width={400}
                  height={112}
                  className="w-full h-full object-cover"
                />
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
            <CardContent>
              <h4 className="font-semibold text-gray-900 text-lg">
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
