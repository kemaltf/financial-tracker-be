import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Courier } from './entity/courier.entity';
import { Store } from '@app/store/store.entity';
import { User } from '@app/user/user.entity';

@Injectable()
export class CourierService {
  constructor(
    @InjectRepository(Courier)
    private readonly courierRepository: Repository<Courier>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  // Get all couriers allowed for a user
  async getAllowedCouriers(storeId: number) {
    const couriers = await this.courierRepository.find({
      where: { store: { id: storeId } },
    });

    return couriers.map((courier) => ({
      label: courier.name, // Atau bisa pakai nama yang lebih user-friendly
      value: courier.id,
      code: courier.courierCode,
      service: courier.allowedServices,
    }));
  }

  async toggleCourierStatus(
    storeId: number,
    courierCode: string,
    service: string,
    user: User,
    action: 'enable' | 'disable',
  ) {
    // 1️⃣ Cek apakah store ada
    const store = await this.storeRepository.findOne({
      where: { id: storeId, user: { id: user.id } },
      relations: ['couriers', 'user'],
    });
    if (!store) throw new NotFoundException('Store not found');

    // 2️⃣ Cek apakah courier sudah ada untuk store ini
    let courier = store.couriers.find((c) => c.courierCode === courierCode);

    if (!courier) {
      if (action === 'disable') {
        throw new BadRequestException('Courier does not exist');
      }

      // 3️⃣ Jika belum ada dan ingin mengaktifkan, buat baru
      courier = this.courierRepository.create({
        store,
        name: courierCode.toUpperCase(),
        courierCode,
        allowedServices: [service], // Tambahkan service pertama kali
      });

      await this.courierRepository.save(courier);
    } else {
      // 4️⃣ Jika sudah ada, update services
      if (action === 'enable') {
        if (!courier.allowedServices.includes(service)) {
          courier.allowedServices.push(service);
        }
      } else if (action === 'disable') {
        courier.allowedServices = courier.allowedServices.filter(
          (s) => s !== service,
        );
      }

      await this.courierRepository.save(courier);
    }

    return { message: 'Courier updated successfully', courier };
  }

  async listExistingCourier() {
    // 2️⃣ List courier dan layanan dari RajaOngkir
    return [
      { label: 'JNE', code: 'jne', services: ['JTR', 'REG', 'OKE'] },
      { label: 'POS', code: 'pos', services: ['Express', 'Reguler'] },
      { label: 'TIKI', code: 'tiki', services: ['ONS', 'REG', 'ECO'] },
      { label: 'SiCepat', code: 'sicepat', services: ['BEST', 'REG'] },
      { label: 'AnterAja', code: 'anteraja', services: ['SameDay', 'NextDay'] },
    ];
  }

  async updateAllowedServices(
    courierId: number,
    services: string[],
  ): Promise<Courier> {
    const courier = await this.courierRepository.findOne({
      where: { id: courierId },
    });

    if (!courier) {
      throw new NotFoundException('Courier not found');
    }

    courier.allowedServices = services; // Update daftar layanan
    return this.courierRepository.save(courier);
  }
}
