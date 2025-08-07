docker build -t shahabvalizade/multi-client:latest -t shahabvalizade/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t shahabvalizade/multi-server:latest -t shahabvalizade/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t shahabvalizade/multi-worker:latest -t shahabvalizade/multi-worker:$SHA -f ./worker/Dockerfile ./worker
docker push shahabvalizade/multi-client:latest
docker push shahabvalizade/multi-server:latest
docker push shahabvalizade/multi-worker:latest
docker push shahabvalizade/multi-client:$SHA
docker push shahabvalizade/multi-server:$SHA
docker push shahabvalizade/multi-worker:$SHA
kubectl apply -f k8s
kubectl set image deployments/client-deployment client=shahabvalizade/multi-client:$SHA
kubectl set image deployments/server-deployment server=shahabvalizade/multi-server:$SHA
kubectl set image deployments/worker-deployment worker=shahabvalizade/multi-worker:$SHA