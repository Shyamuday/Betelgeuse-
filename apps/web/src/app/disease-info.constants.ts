import { DiseaseInfo } from './models';
import { chronicCareDiseaseInfo } from './chronic-care-disease-info.constants';
import { hairFallDiseaseInfo } from './hair-fall-disease-info.constants';
import { skinCareDiseaseInfo } from './skin-care-disease-info.constants';

export const diseaseInfos: DiseaseInfo[] = [hairFallDiseaseInfo, skinCareDiseaseInfo, chronicCareDiseaseInfo];
