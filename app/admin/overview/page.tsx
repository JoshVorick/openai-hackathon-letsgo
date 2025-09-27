import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHotelOverview, getMonthlyOccupancy, getUpcomingWeekRates } from "./queries";

export default async function AdminOverviewPage() {
  const [hotelInfo, monthlyOccupancy, upcomingRates] = await Promise.all([
    getHotelOverview(),
    getMonthlyOccupancy(),
    getUpcomingWeekRates(),
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hotel Admin Overview</h1>
        <Badge variant="outline">Last updated: {new Date().toLocaleDateString()}</Badge>
      </div>

      {/* Hotel Information */}
      <Card>
        <CardHeader>
          <CardTitle>Hotel Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{hotelInfo.company.name}</h3>
              <p className="text-gray-600 mb-2">{hotelInfo.company.address}</p>
              {hotelInfo.company.url && (
                <a 
                  href={hotelInfo.company.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Visit Website
                </a>
              )}
              <div className="mt-4">
                <p><strong>Contact:</strong> {hotelInfo.company.contact}</p>
                <p><strong>Phone:</strong> {hotelInfo.company.phoneNumber}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Services</h4>
              <div className="space-y-2">
                {hotelInfo.services.map((service: any) => (
                  <div key={service.id} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{service.name}</span>
                      <Badge variant="secondary">{service.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Rate Range: ${service.rateLowerUsd} - ${service.rateUpperUsd}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p><strong>Total Rooms:</strong> {hotelInfo.totalRooms}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Occupancy */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Month-over-Month Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {monthlyOccupancy.map((month: any) => (
              <div key={month.month} className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{month.occupancyRate}%</div>
                <div className="text-sm text-gray-600">{month.month}</div>
                <div className="text-xs text-gray-500">
                  {month.reservedRooms}/{month.totalRooms} rooms
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Week Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Week Rates (Sep 29 - Oct 5, 2025)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {upcomingRates.map((day: any) => (
              <div key={day.date} className="p-4 border rounded">
                <div className="text-center">
                  <div className="font-semibold">{day.dayName}</div>
                  <div className="text-sm text-gray-600">{day.date}</div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    ${day.price}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {day.availableRooms} available
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.occupancyRate}% occupied
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}