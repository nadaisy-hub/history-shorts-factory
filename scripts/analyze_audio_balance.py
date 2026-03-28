"""
나레이션과 BGM의 라우드니스(LUFS)를 측정하고
BGM 볼륨을 자동 조정하는 스크립트

사용법:
  pip install moviepy pyloudnorm numpy
  python scripts/analyze_audio_balance.py <나레이션.mp3> <BGM.mp3> [목표dB차이]

예시:
  python scripts/analyze_audio_balance.py data/audio/project123.mp3 bgm/epic.mp3
  python scripts/analyze_audio_balance.py data/audio/project123.mp3 bgm/epic.mp3 22
"""
import sys
import numpy as np

def analyze_with_pyloudnorm(nar_audio, nar_sr, bgm_audio, bgm_sr, target_diff_db=20):
    """pyloudnorm 기반 LUFS 분석"""
    import pyloudnorm as pyln

    meter_nar = pyln.Meter(nar_sr)
    meter_bgm = pyln.Meter(bgm_sr)

    # 스테레오로 변환 (pyloudnorm 요구사항)
    if nar_audio.shape[1] == 1:
        nar_stereo = np.column_stack([nar_audio, nar_audio])
    else:
        nar_stereo = nar_audio

    if bgm_audio.shape[1] == 1:
        bgm_stereo = np.column_stack([bgm_audio, bgm_audio])
    else:
        bgm_stereo = bgm_audio

    nar_lufs = meter_nar.integrated_loudness(nar_stereo)
    bgm_lufs = meter_bgm.integrated_loudness(bgm_stereo)

    print(f"나레이션 라우드니스: {nar_lufs:.1f} LUFS")
    print(f"BGM 라우드니스:      {bgm_lufs:.1f} LUFS")
    print(f"현재 차이:           {abs(nar_lufs - bgm_lufs):.1f} dB")

    # 최적 볼륨 계산
    target_bgm_lufs = nar_lufs - target_diff_db
    adjustment_db = target_bgm_lufs - bgm_lufs
    volume_scale = 10 ** (adjustment_db / 20)

    print(f"\n=== 추천 설정 ===")
    print(f"목표 BGM 라우드니스: {target_bgm_lufs:.1f} LUFS (나레이션 대비 -{target_diff_db}dB)")
    print(f"필요 조정:           {adjustment_db:.1f} dB")
    print(f"추천 볼륨 스케일:    {volume_scale:.3f}")

    # 대시보드 설정값 안내
    print(f"\n=== 대시보드에 입력할 값 ===")
    print(f"  LUFS 자동 밸런싱 ON → target_diff_db: {target_diff_db}")
    print(f"  또는 수동 모드 → bgm_volume: {volume_scale:.3f}")

    return volume_scale


def analyze_with_rms(nar_audio, bgm_audio, target_ratio=0.10):
    """pyloudnorm 없을 때 RMS 기반 분석"""
    nar_rms = np.sqrt(np.mean(nar_audio ** 2))
    bgm_rms = np.sqrt(np.mean(bgm_audio ** 2))

    print(f"나레이션 RMS: {nar_rms:.4f}")
    print(f"BGM RMS:      {bgm_rms:.4f}")

    ratio = bgm_rms / nar_rms
    print(f"BGM/나레이션 비율: {ratio:.2f}")

    recommended_scale = target_ratio / ratio
    print(f"\n추천 볼륨 스케일: {recommended_scale:.3f}")
    return recommended_scale


def main():
    if len(sys.argv) < 3:
        print("사용법: python analyze_audio_balance.py <나레이션.mp3> <BGM.mp3> [목표dB차이]")
        sys.exit(1)

    narration_path = sys.argv[1]
    bgm_path = sys.argv[2]
    target_diff_db = int(sys.argv[3]) if len(sys.argv) > 3 else 20

    from moviepy import AudioFileClip

    print("=== 오디오 밸런스 분석 ===\n")

    # 나레이션 로드
    narration = AudioFileClip(narration_path)
    nar_sr = narration.fps
    nar_audio = narration.to_soundarray()
    if nar_audio.ndim == 1:
        nar_audio = nar_audio.reshape(-1, 1)

    # BGM 로드
    bgm = AudioFileClip(bgm_path)
    bgm_sr = bgm.fps
    bgm_audio = bgm.to_soundarray()
    if bgm_audio.ndim == 1:
        bgm_audio = bgm_audio.reshape(-1, 1)

    try:
        analyze_with_pyloudnorm(nar_audio, nar_sr, bgm_audio, bgm_sr, target_diff_db)
    except ImportError:
        print("pyloudnorm 미설치 → RMS 기반 분석\n")
        analyze_with_rms(nar_audio, bgm_audio)

    narration.close()
    bgm.close()


if __name__ == "__main__":
    main()
