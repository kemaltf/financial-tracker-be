export enum CourierType {
  JNE = 'jne',
  POS = 'pos',
  TIKI = 'tiki',
  RPX = 'rpx',
  PANDU = 'pandu',
  WAHANA = 'wahana',
  SICEPAT = 'sicepat',
  JNT = 'jnt',
  PAHALA = 'pahala',
  SAP = 'sap',
  JET = 'jet',
  INDAH = 'indah',
  DSE = 'dse',
  SLIS = 'slis',
  FIRST = 'first',
  NCS = 'ncs',
  STAR = 'star',
  NINJA = 'ninja',
  LION = 'lion',
  IDL = 'idl',
  REX = 'rex',
  IDE = 'ide',
  SENTRAL = 'sentral',
  ANTERAJA = 'anteraja',
  JTL = 'jtl',
}

export enum OriginType {
  CITY = 'city',
  SUBDISTRICT = 'subdistrict',
}
export enum DestinationType {
  CITY = 'city',
  SUBDISTRICT = 'subdistrict',
}
export type ShippingCostProps = {
  origin: string; // id city/subdistict asal
  originType: OriginType;
  destination: string; // destination id
  destinationType: DestinationType;
  weight: number;
  lenght?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  courier: CourierType;
};
export type InternationalShippingCostProps = {
  origin: string; // id city/subdistict asal
  destination: string; // destination id
  weight: number;
  lenght?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  courier: CourierType;
};
export type WaybillProps = {
  waybill: string;
  courier: CourierType;
};

export type Province = {
  province_id: string;
  province: string;
};

export type GetProvincesResponse = {
  rajaongkir: {
    query: object;
    status: {
      code: number;
      description: string;
    };
    results: Province[];
  };
};

export type City = {
  city_id: string;
  province_id: string;
  province: string;
  type: string;
  city_name: string;
  postal_code: string;
};

export type GetCitiesResponse = {
  rajaongkir: {
    query: object;
    status: {
      code: number;
      description: string;
    };
    results: City[];
  };
};

export type Subdistrict = {
  subdistrict_id: string;
  province_id: string;
  province: string;
  city_id: string;
  city: string;
  type: string;
  subdistrict_name: string;
};

export type GetSubdistrictsResponse = {
  rajaongkir: {
    query: object;
    status: {
      code: number;
      description: string;
    };
    results: Subdistrict[];
  };
};

export type ShippingCostResponse = {
  rajaongkir: {
    query: {
      origin: string;
      destination: string;
      weight: number;
      courier: string;
    };
    status: {
      code: number;
      description: string;
    };
    origin_details: {
      city_id: string;
      province_id: string;
      province: string;
      type: string;
      city_name: string;
      postal_code: string;
    };
    destination_details: {
      city_id: string;
      province_id: string;
      province: string;
      type: string;
      city: string;
      postal_code: string;
      subdistrict_name: string;
    };
    results: Array<{
      code: string;
      name: string;
      costs: Array<{
        service: string;
        description: string;
        cost: Array<{
          value: number;
          etd: string;
          note: string;
        }>;
      }>;
    }>;
  };
};

export type Country = {
  country_id: string;
  country_name: string;
};

export type GetCountriesResponse = {
  rajaongkir: {
    query: object;
    status: {
      code: number;
      description: string;
    };
    results: Country[];
  };
};

export type InternationalOrigin = {
  city_id: string;
  province_id: string;
  province: string;
  type: string;
  city_name: string;
  postal_code: string;
};

export type GetInternationalOriginResponse = {
  rajaongkir: {
    query: object;
    status: {
      code: number;
      description: string;
    };
    results: InternationalOrigin[];
  };
};

export type InternationalCost = {
  service: string;
  description: string;
  cost: {
    value: number;
    etd: string;
    note: string;
  }[];
};

export type GetInternationalCostResponse = {
  rajaongkir: {
    query: object;
    status: {
      code: number;
      description: string;
    };
    results: InternationalCost[];
  };
};

export type WaybillDetails = {
  waybill_number: string;
  waybill_date: string;
  waybill_time: string;
  weight: string;
  origin: string;
  destination: string;
  shippper_name: string;
  receiver_name: string;
  status: string;
};

export type WaybillManifest = {
  manifest_code: string;
  manifest_description: string;
  manifest_date: string;
  manifest_time: string;
  city_name: string;
};

export type CheckWaybillResponse = {
  rajaongkir: {
    query: object;
    status: {
      code: number;
      description: string;
    };
    result: {
      summary: WaybillDetails;
      details: object;
      delivery_status: object;
      manifest: WaybillManifest[];
    };
  };
};
