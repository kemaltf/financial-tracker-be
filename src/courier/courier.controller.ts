import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { CourierService } from './courier.service';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';

@Controller('couriers')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  // Get allowed couriers for a user
  @Get(':storeId')
  async getAllowedCouriers(@Param('storeId') storeId: number) {
    return this.courierService.getAllowedCouriers(storeId);
  }

  @Get()
  async getCouriers() {
    return this.courierService.listExistingCourier();
  }

  @Put(':storeId/:courierCode')
  async toggleCourier(
    @Param('storeId') storeId: number,
    @Param('courierCode') courierCode: string,
    @Body() body: { service: string; action: 'enable' | 'disable' },
    @GetUser() user: User,
  ) {
    return this.courierService.toggleCourierStatus(
      storeId,
      courierCode,
      body.service,
      user,
      body.action,
    );
  }
}
