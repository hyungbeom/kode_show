import { useGLTF } from '@react-three/drei'
import { DRACO_DECODER_URL } from './utils/dracoDecoder'

useGLTF.setDecoderPath(DRACO_DECODER_URL)
