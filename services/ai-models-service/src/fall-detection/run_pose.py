import cv2
import time
import torch
import argparse
import numpy as np
from utils.datasets import letterbox
from utils.torch_utils import select_device
from models.experimental import attempt_load
from utils.plots import output_to_keypoint, plot_skeleton_kpts
from utils.general import non_max_suppression_kpt, strip_optimizer
from torchvision import transforms



@torch.no_grad()
def run(poseweights= 'yolov7-w6-pose.pt', source='pose.mp4', device='cpu'):

    path = source
    ext = path.split('/')[-1].split('.')[-1].strip().lower()
    if ext in ["mp4", "webm", "avi"] or ext not in ["mp4", "webm", "avi"] and ext.isnumeric():
        input_path = int(path) if path.isnumeric() else path
        device = select_device(opt.device)
        half = device.type != 'cpu'
        model = attempt_load(poseweights, map_location=device)
        _ = model.eval()

        cap = cv2.VideoCapture(input_path)

        if (cap.isOpened() == False):
            print('Error while trying to read video. Please check path again')

        frame_width, frame_height = int(cap.get(3)), int(cap.get(4))

        vid_write_image = letterbox(
            cap.read()[1], (frame_width), stride=64, auto=True)[0]
        resize_height, resize_width = vid_write_image.shape[:2]
        out_video_name = "output" if path.isnumeric else f"{input_path.split('/')[-1].split('.')[0]}"
        out = cv2.VideoWriter(f"{out_video_name}_result4.mp4", cv2.VideoWriter_fourcc(*'mp4v'), 30, (resize_width, resize_height))

        frame_count, total_fps = 0, 0

        while cap.isOpened:

            print(f"Frame {frame_count} Processing")
            ret, frame = cap.read()
            if ret:
                orig_image = frame

                # preprocess image
                image = cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB)
                image = letterbox(image, (frame_width), stride=64, auto=True)[0]
                image_ = image.copy()
                image = transforms.ToTensor()(image)
                image = torch.tensor(np.array([image.numpy()]))

                image = image.to(device)
                image = image.half() if half else image.float()
                start_time = time.time()

                with torch.no_grad():
                    output, _ = model(image)

                output = non_max_suppression_kpt(output, 0.25, 0.65, nc=model.yaml['nc'], nkpt=model.yaml['nkpt'], kpt_label=True)
                output = output_to_keypoint(output)
                im0 = image[0].permute(1, 2, 0) * 255
                im0 = im0.cpu().numpy().astype(np.uint8)

                im0 = cv2.cvtColor(im0, cv2.COLOR_RGB2BGR)

                gn = torch.tensor(im0.shape)[[1, 0, 1, 0]]
                for i, pose in enumerate(output):
                    if len(output[i]) > 0:
                        for c in pose[:, 5].unique():
                            n = (pose[:, 5] == c).sum()
                            print("No of Objects in Current Frame : {}".format(n))

                        pose[:, :4] = pose[:, :4].clone()
                        pose[:, 5:] = pose[:, 5:].clone()

                        for det_index, (*xyxy, conf, cls) in enumerate(reversed(pose[:, :6])):
                            c = int(cls)
                            kpts = pose[det_index, 6:]
                            plot_skeleton_kpts(im0, kpts, 3)

                end_time = time.time()
                fps = 1 / (end_time - start_time)
                total_fps += fps
                frame_count += 1

                cv2.putText(im0, f'FPS: {int(fps)}', (11, 100), 0, 1, [255, 0, 0], thickness=2, lineType=cv2.LINE_AA)

                cv2.imshow('image', im0)
                out.write(im0)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            else:
                break

        cap.release()
        cv2.destroyAllWindows()
        avg_fps = total_fps / frame_count
        print(f"Average FPS: {avg_fps:.3f}")


def parse_opt():
    parser = argparse.ArgumentParser()
    parser.add_argument('--poseweights', nargs='+', type=str, default='yolov7-w6-pose.pt', help='model path(s)')
    parser.add_argument('--source', type=str, default='football1.mp4', help='video/0 for webcam')
    parser.add_argument('--device', type=str, default='cpu', help='cpu/0,1,2,3(gpu)')

    opt = parser.parse_args()
    return opt


if __name__ == "__main__":
    opt = parse_opt()
    strip_optimizer(opt.device, opt.poseweights)
    run(opt.poseweights, opt.source, opt.device)
