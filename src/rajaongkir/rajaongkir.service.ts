import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs/operators';
import { HandleErrors } from 'src/common/decorators';
import * as T from './types';
import { lastValueFrom } from 'rxjs';

type GetSubdistrictType = {
  cityId?: string | null;
  id?: string | null;
};

@Injectable()
export class RajaOngkirService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('RAJA_ONGKIR_API_KEY');
    this.baseUrl = this.configService.get<string>('RAJA_ONGKIR_API');
  }

  @HandleErrors()
  async getProvinces(
    id?: string | null,
  ): Promise<T.GetProvincesResponse['rajaongkir']['results']> {
    const url = `${this.baseUrl}/province`;
    const params = id ? { id } : {};
    return await lastValueFrom(
      this.httpService
        .get(url, {
          params,
          headers: {
            key: this.apiKey,
          },
        })
        .pipe(map((response) => response.data.rajaongkir.results)),
    );
  }

  @HandleErrors()
  async getCities(
    id?: string | null,
    provinceId?: string | null,
  ): Promise<T.GetCitiesResponse['rajaongkir']['results']> {
    const url = `${this.baseUrl}/city`;

    const params: any = {};
    if (id) params.id = id;
    if (provinceId) params.province = provinceId;

    return await lastValueFrom(
      this.httpService
        .get(url, {
          params,
          headers: {
            key: this.apiKey,
          },
        })
        .pipe(map((response) => response.data.rajaongkir.results)),
    );
  }

  @HandleErrors()
  async getSubdistricts({
    cityId,
    id,
  }: GetSubdistrictType): Promise<
    T.GetSubdistrictsResponse['rajaongkir']['results']
  > {
    const url = `${this.baseUrl}/subdistrict`;

    const params: any = {};
    if (cityId) params.city = cityId;
    if (id) params.id = id;

    return await lastValueFrom(
      this.httpService
        .get(url, {
          params,
          headers: {
            key: this.apiKey,
          },
        })
        .pipe(map((response) => response.data.rajaongkir.results)),
    );
  }

  @HandleErrors()
  async getShippingCost(
    params: T.ShippingCostProps,
  ): Promise<T.ShippingCostResponse['rajaongkir']> {
    const url = `${this.baseUrl}/cost`;
    return await lastValueFrom(
      this.httpService
        .post(url, params, {
          headers: {
            key: this.apiKey,
          },
        })
        .pipe(map((response) => response.data.rajaongkir)),
    );
  }

  @HandleErrors()
  async getCountries(
    id?: string | null,
  ): Promise<T.GetCountriesResponse['rajaongkir']['results']> {
    const url = `${this.baseUrl}/v2/internationalDestination`;
    const params = id ? { id } : {};
    return lastValueFrom(
      this.httpService
        .get(url, {
          params,
          headers: {
            key: this.apiKey,
          },
        })
        .pipe(map((response) => response.data.rajaongkir.results)),
    );
  }

  @HandleErrors()
  async getInternationalCost(
    props: T.InternationalShippingCostProps,
  ): Promise<T.GetInternationalCostResponse['rajaongkir']> {
    const url = `${this.baseUrl}/v2/internationalCost`;
    return lastValueFrom(
      this.httpService
        .post(url, props, {
          headers: {
            key: this.apiKey,
          },
        })
        .pipe(map((response) => response.data.rajaongkir)),
    );
  }

  @HandleErrors()
  async checkWaybill(
    props: T.WaybillProps,
  ): Promise<T.CheckWaybillResponse['rajaongkir']> {
    const url = `${this.baseUrl}/waybill`;
    return lastValueFrom(
      this.httpService
        .post<T.CheckWaybillResponse>(url, props, {
          headers: {
            key: this.apiKey,
          },
        })
        .pipe(map((response) => response.data.rajaongkir)),
    );
  }
}
