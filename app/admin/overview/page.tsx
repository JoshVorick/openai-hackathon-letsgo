import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getHotelOverview,
  getMonthlyOccupancy,
  getUpcomingWeekRates,
} from "./queries";

export default async function AdminOverviewPage() {
  const [hotelInfo, monthlyOccupancy, upcomingRates] = await Promise.all([
    getHotelOverview(),
    getMonthlyOccupancy(),
    getUpcomingWeekRates(),
  ]);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">Hotel Admin Overview</h1>
        <Badge variant="outline">
          Last updated: {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {/* Hotel Information */}
      <Card>
        <CardHeader>
          <CardTitle>Hotel Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-lg">
                {hotelInfo.company.name}
              </h3>
              <p className="mb-2 text-gray-600">{hotelInfo.company.address}</p>
              {hotelInfo.company.url && (
                <a
                  className="text-blue-600 hover:underline"
                  href={hotelInfo.company.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Visit Website
                </a>
              )}
              <div className="mt-4">
                <p>
                  <strong>Contact:</strong> {hotelInfo.company.contact}
                </p>
                <p>
                  <strong>Phone:</strong> {hotelInfo.company.phoneNumber}
                </p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Services</h4>
              <div className="space-y-2">
                {hotelInfo.services.map((service: any) => (
                  <div className="rounded bg-gray-50 p-3" key={service.id}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{service.name}</span>
                      <Badge variant="secondary">{service.type}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Rate Range: ${service.rateLowerUsd} - $
                      {service.rateUpperUsd}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p>
                  <strong>Total Rooms:</strong> {hotelInfo.totalRooms}
                </p>
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {monthlyOccupancy.map((month: any) => (
              <div
                className="rounded bg-gray-50 p-4 text-center"
                key={month.month}
              >
                <div className="font-bold text-2xl text-blue-600">
                  {month.occupancyRate}%
                </div>
                <div className="text-gray-600 text-sm">{month.month}</div>
                <div className="text-gray-500 text-xs">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
            {upcomingRates.map((day: any) => (
              <div className="rounded border p-4" key={day.date}>
                <div className="text-center">
                  <div className="font-semibold">{day.dayName}</div>
                  <div className="text-gray-600 text-sm">{day.date}</div>
                  <div className="mt-2 font-bold text-2xl text-green-600">
                    ${day.price}
                  </div>
                  <div className="mt-1 text-gray-500 text-xs">
                    {day.availableRooms} available
                  </div>
                  <div className="text-gray-500 text-xs">
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
