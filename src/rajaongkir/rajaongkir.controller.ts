import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RajaOngkirService } from './rajaongkir.service';
import * as T from './types';
import { CreateProvincesDto } from './dto/create-provinces.dto';
import { CreateCitiesDto } from './dto/create-cities.dto';
import { CreateSubdistrictsDto } from './dto/create-subdistricts.dto';
import { ShippingCostDto } from './dto/shipping-cost.dto';
import { CreateCountryDto } from './dto/create-countries';
import { InternationalCostDto } from './dto/international-cost.dto';

@Controller('shipping')
export class RajaOngkirController {
  constructor(private readonly rajaOngkirService: RajaOngkirService) {}

  @HttpCode(HttpStatus.OK)
  @Get('provinces')
  async getProvinces(@Query('id') query: CreateProvincesDto) {
    return await this.rajaOngkirService.getProvinces(query.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('cities')
  async getCities(@Query() query: CreateCitiesDto) {
    return await this.rajaOngkirService.getCities(query.id, query.provinceId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('subdistrict')
  async getSubdistricts(@Query() query: CreateSubdistrictsDto) {
    return await this.rajaOngkirService.getSubdistricts({
      cityId: query.cityId,
      id: query.id,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('cost/:storeId')
  async getShippingCost(
    @Body() body: ShippingCostDto,
    @Param('storeId') storeId: number,
  ) {
    return await this.rajaOngkirService.getShippingCost(body, storeId);
  }
  @HttpCode(HttpStatus.OK)
  @Get('countries')
  async getCountries(@Query() query: CreateCountryDto) {
    return await this.rajaOngkirService.getCountries(query.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('international-cost')
  async getInternationalCost(@Body() body: InternationalCostDto) {
    const result = await this.rajaOngkirService.getInternationalCost(body);
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('check-waybill')
  async checkWaybill(
    @Body() body: T.WaybillProps,
  ): Promise<T.CheckWaybillResponse['rajaongkir']> {
    const result = await this.rajaOngkirService.checkWaybill(body);
    return result;
  }
}
