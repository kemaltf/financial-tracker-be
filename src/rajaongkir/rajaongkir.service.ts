import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs/operators';
import { HandleErrors } from 'src/common/decorators';
import * as T from './types';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Courier } from '@app/courier/entity/courier.entity';
import { In, Repository } from 'typeorm';
import { Store } from '@app/store/store.entity';

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

    @InjectRepository(Courier)
    private readonly courierRepository: Repository<Courier>,

    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
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
    storeId,
  ): Promise<T.ShippingCostResponse['rajaongkir']> {
    const url = `${this.baseUrl}/cost`;

    // Pastikan params.courier adalah array
    if (!Array.isArray(params.courier) || params.courier.length === 0) {
      throw new Error('Minimal satu kurir harus dipilih');
    }

    // Fetch daftar kurir yang diizinkan untuk store tertentu
    const couriers = await this.courierRepository.find({
      where: {
        courierCode: In(params.courier), // Filter berdasarkan array kurir
        store: { id: storeId },
      },
      relations: ['store'],
    });

    if (!couriers.length) {
      throw new Error('Tidak ada kurir yang tersedia untuk toko ini');
    }

    // Fetch data pengiriman untuk setiap kurir
    const responses = await Promise.all(
      params.courier.map(async (courierCode) => {
        const response = await lastValueFrom(
          this.httpService
            .post(
              url,
              { ...params, courier: courierCode },
              { headers: { key: this.apiKey } },
            )
            .pipe(map((res) => res.data.rajaongkir)),
        );

        return response;
      }),
    );

    console.log('=>', JSON.stringify(responses));

    // Gabungkan hasil dari berbagai kurir dan filter layanan yang diizinkan
    const combinedResults = responses.flatMap((rajaongkir) =>
      rajaongkir.results.map((result) => {
        const allowedCourier = couriers.find(
          (c) => c.courierCode === result.code,
        );
        return {
          ...result,
          costs: result.costs.filter((cost) =>
            allowedCourier?.allowedServices.includes(cost.service),
          ),
        };
      }),
    );

    // Hanya ambil yang memiliki layanan tersedia
    return {
      query: {
        origin: params.origin,
        destination: params.destination,
        weight: params.weight,
        courier: params.courier.join(','),
      },
      status: responses[0].status,
      origin_details: responses[0].origin_details,
      destination_details: responses[0].destination_details,
      results: combinedResults.filter((result) => result.costs.length > 0),
    };
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
