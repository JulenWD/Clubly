import {MongooseModule} from "@nestjs/mongoose";
import {Club, ClubSchema} from "./club.schema";
import {ClubController} from "./club.controller";
import {ClubService} from "./club.service";
import {Module, forwardRef} from "@nestjs/common";
import { ReviewModule } from '../Review/review.module';
import { PagosModule } from '../Pagos/pagos.module';

@Module({
    imports: [
        MongooseModule.forFeature([{name: Club.name, schema: ClubSchema}]),
        forwardRef(() => ReviewModule),
        forwardRef(() => PagosModule)
    ],
    controllers: [ClubController],
    providers: [ClubService],
    exports: [ClubService]
})
export class ClubModule {}