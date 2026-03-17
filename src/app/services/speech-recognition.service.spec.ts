import { Test, TestingModule } from '@nestjs/testing';
import { SpeechRecognitionService } from './speech-recognition.service';

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpeechRecognitionService],
    }).compile();

    service = module.get<SpeechRecognitionService>(SpeechRecognitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
